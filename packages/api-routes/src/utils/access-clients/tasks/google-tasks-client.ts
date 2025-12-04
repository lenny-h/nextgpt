import { CloudTasksClient } from "@google-cloud/tasks";
import { createLogger } from "@workspace/server/logger.js";
import {
  CancelTaskParams,
  ITasksClient,
  ScheduleProcessingTaskParams,
} from "../interfaces/tasks-client.interface.js";

const logger = createLogger("google-tasks-client");

/**
 * Google Cloud Tasks implementation for job-based processing
 * Uses Cloud Tasks to trigger Cloud Run Jobs via the Cloud Run Admin API
 * Supports delays up to 30 days via Cloud Tasks scheduling
 */
export class GoogleTasksClient implements ITasksClient {
  private client: CloudTasksClient;

  constructor() {
    this.client = new CloudTasksClient();
  }

  async scheduleProcessingTask(
    params: ScheduleProcessingTaskParams
  ): Promise<void> {
    const { taskId, jobType, payload, scheduleTime } = params;

    const projectId = process.env.GOOGLE_VERTEX_PROJECT;
    const location = process.env.GOOGLE_VERTEX_LOCATION;

    const queue = process.env.GOOGLE_PROCESSING_QUEUE;
    const jobName = process.env.GOOGLE_DOCUMENT_PROCESSOR_JOB;

    const serviceAccountEmail = `cloud-tasks-sa@${projectId}.iam.gserviceaccount.com`;
    const queuePath = `projects/${projectId}/locations/${location}/queues/${queue}`;

    if (!projectId || !location || !queue) {
      throw new Error(
        "Missing required environment variables: GOOGLE_VERTEX_PROJECT, GOOGLE_VERTEX_LOCATION, or GOOGLE_PROCESSING_QUEUE"
      );
    }

    const fullTaskPath = this.client.taskPath(
      projectId,
      location,
      queue,
      taskId
    );

    // Build environment variable overrides for the Cloud Run Job
    const envOverrides: Array<{ name: string; value: string }> = [
      { name: "JOB_TYPE", value: jobType },
      { name: "TASK_ID", value: payload.taskId },
      { name: "BUCKET_ID", value: payload.bucketId },
      { name: "FILE_NAME", value: payload.name },
      { name: "FILE_SIZE", value: payload.size },
      { name: "CONTENT_TYPE", value: payload.contentType || "application/pdf" },
      {
        name: "PAGE_NUMBER_OFFSET",
        value: String(payload.pageNumberOffset || 0),
      },
    ];

    // Add pipeline options if present
    if (payload.pipelineOptions) {
      const opts = payload.pipelineOptions;
      if (opts.do_ocr !== undefined) {
        envOverrides.push({ name: "DO_OCR", value: String(opts.do_ocr) });
      }
      if (opts.do_table_structure !== undefined) {
        envOverrides.push({
          name: "DO_TABLE_STRUCTURE",
          value: String(opts.do_table_structure),
        });
      }
      if (opts.do_formula_enrichment !== undefined) {
        envOverrides.push({
          name: "DO_FORMULA_ENRICHMENT",
          value: String(opts.do_formula_enrichment),
        });
      }
      if (opts.do_code_enrichment !== undefined) {
        envOverrides.push({
          name: "DO_CODE_ENRICHMENT",
          value: String(opts.do_code_enrichment),
        });
      }
      if (opts.do_picture_description !== undefined) {
        envOverrides.push({
          name: "DO_PICTURE_DESCRIPTION",
          value: String(opts.do_picture_description),
        });
      }
    }

    // Cloud Run Admin API endpoint to run a job
    // See: https://cloud.google.com/run/docs/reference/rest/v2/projects.locations.jobs/run
    const adminApiUrl = `https://run.googleapis.com/v2/projects/${projectId}/locations/${location}/jobs/${jobName}:run`;

    // Request body for the Cloud Run Admin API
    // Passes environment variables as container overrides
    const requestBody = {
      overrides: {
        containerOverrides: [
          {
            env: envOverrides,
          },
        ],
      },
    };

    const task = {
      name: fullTaskPath,
      httpRequest: {
        httpMethod: "POST" as const,
        url: adminApiUrl,
        headers: {
          "Content-Type": "application/json",
        },
        body: Buffer.from(JSON.stringify(requestBody)).toString("base64"),
        oidcToken: {
          serviceAccountEmail,
          // The audience should be the Cloud Run Admin API
          audience: "https://run.googleapis.com",
        },
      },
      scheduleTime: {
        seconds: Math.floor(scheduleTime.getTime() / 1000),
      },
    };

    await this.client.createTask({
      parent: queuePath,
      task,
    });

    logger.info(
      `Scheduled Cloud Run Job: ${taskId} for ${scheduleTime.toISOString()} (job-type: ${jobType})`
    );
  }

  async cancelTask(params: CancelTaskParams): Promise<void> {
    const { taskId } = params;

    const projectId = process.env.GOOGLE_VERTEX_PROJECT;
    const location = process.env.GOOGLE_VERTEX_LOCATION;
    const queue = process.env.GOOGLE_PROCESSING_QUEUE;

    if (!projectId || !location || !queue) {
      throw new Error(
        "Missing required environment variables: GOOGLE_VERTEX_PROJECT, GOOGLE_VERTEX_LOCATION, or GOOGLE_PROCESSING_QUEUE"
      );
    }

    const fullTaskPath = this.client.taskPath(
      projectId,
      location,
      queue,
      taskId
    );

    try {
      await this.client.deleteTask({ name: fullTaskPath });
      logger.info(`Cancelled scheduled task: ${taskId}`);
    } catch (error: any) {
      if (error.code === 5) {
        // NOT_FOUND
        logger.warn(
          `Task not found: ${taskId}. It may have already been executed or deleted.`
        );
      } else {
        throw error;
      }
    }
  }
}
