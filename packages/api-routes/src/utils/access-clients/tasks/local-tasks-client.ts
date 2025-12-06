import { createLogger } from "@workspace/server/logger.js";
import Docker, { type Container } from "dockerode";
import {
  CancelTaskParams,
  ITasksClient,
  JobType,
  ScheduleProcessingTaskParams,
} from "../interfaces/tasks-client.interface.js";

const logger = createLogger("local-tasks-client");

/**
 * Local tasks client for development
 * Runs document processor jobs as Docker containers, matching the cloud architecture
 * Uses the same document-processor Docker image as production
 */
export class LocalTasksClient implements ITasksClient {
  private docker: Docker;
  private scheduledTasks: Map<string, NodeJS.Timeout> = new Map();
  private runningContainers: Map<string, Container> = new Map();

  constructor() {
    // Connect to Docker daemon
    // On Windows, this works with Docker Desktop
    this.docker = new Docker();
  }

  async scheduleProcessingTask(
    params: ScheduleProcessingTaskParams
  ): Promise<void> {
    const { taskId, jobType, payload, scheduleTime } = params;

    const delay = Math.max(0, scheduleTime.getTime() - Date.now());

    logger.debug(`Task scheduled with delay: ${delay}ms`);
    logger.debug(`Task ID: ${taskId}`);
    logger.debug(`Job Type: ${jobType}`);

    // Clear any existing timeout with the same name
    if (this.scheduledTasks.has(taskId)) {
      clearTimeout(this.scheduledTasks.get(taskId));
    }

    // Execute after delay
    const timeout = setTimeout(async () => {
      try {
        logger.info(`Executing task: ${taskId} (${jobType})`);

        await this.runJobContainer(taskId, jobType, payload);

        logger.info(`Task completed successfully`);
      } catch (error) {
        logger.error(`Task execution error:`, error);
      } finally {
        this.scheduledTasks.delete(taskId);
        this.runningContainers.delete(taskId);
      }
    }, delay);

    // Store the timeout
    this.scheduledTasks.set(taskId, timeout);
  }

  private async runJobContainer(
    taskId: string,
    jobType: JobType,
    payload: ScheduleProcessingTaskParams["payload"]
  ): Promise<void> {
    // Build environment variables for the job - same as cloud implementations
    const env: string[] = [
      `JOB_TYPE=${jobType}`,
      `TASK_ID=${payload.taskId}`,
      `BUCKET_ID=${payload.bucketId}`,
      `FILE_NAME=${payload.name}`,
      `FILE_SIZE=${payload.size}`,
      `CONTENT_TYPE=${payload.contentType || "application/pdf"}`,
      `PAGE_NUMBER_OFFSET=${payload.pageNumberOffset || 0}`,
    ];

    // Add pipeline options if present
    if (payload.pipelineOptions) {
      const opts = payload.pipelineOptions;
      if (opts.do_ocr !== undefined) {
        env.push(`DO_OCR=${opts.do_ocr}`);
      }
      if (opts.do_table_structure !== undefined) {
        env.push(`DO_TABLE_STRUCTURE=${opts.do_table_structure}`);
      }
      if (opts.do_formula_enrichment !== undefined) {
        env.push(`DO_FORMULA_ENRICHMENT=${opts.do_formula_enrichment}`);
      }
      if (opts.do_code_enrichment !== undefined) {
        env.push(`DO_CODE_ENRICHMENT=${opts.do_code_enrichment}`);
      }
      if (opts.do_picture_description !== undefined) {
        env.push(`DO_PICTURE_DESCRIPTION=${opts.do_picture_description}`);
      }
    }

    // Pass through necessary environment variables from the API container
    const envVarsToPassThrough = [
      "DATABASE_HOST",
      "DATABASE_PASSWORD",
      "ENCRYPTION_KEY",
      "USE_LOCAL_FILE_STORAGE",
      "USE_CLOUDFLARE_R2",
      "MINIO_ENDPOINT",
      "MINIO_ROOT_USER",
      "MINIO_ROOT_PASSWORD",
      "R2_ENDPOINT",
      "CLOUDFLARE_ACCESS_KEY_ID",
      "CLOUDFLARE_SECRET_ACCESS_KEY",
      "CLOUD_PROVIDER",
      "GOOGLE_VERTEX_PROJECT",
      "GOOGLE_VERTEX_LOCATION",
      "AWS_PROJECT_NAME",
      "AWS_REGION",
    ];

    for (const key of envVarsToPassThrough) {
      if (process.env[key]) {
        env.push(`${key}=${process.env[key]}`);
      }
    }

    // Add ENVIRONMENT and API_URL which document-processor needs but aren't in API env vars
    env.push(`ENVIRONMENT=${process.env.NODE_ENV}`);
    env.push(`API_URL=${process.env.API_URL}`);

    const imageName =
      process.env.DOCUMENT_PROCESSOR_IMAGE || "mono-document-processor:latest";

    try {
      // Create and start the container
      const container = await this.docker.createContainer({
        Image: imageName,
        name: `job-${taskId}`,
        Env: env,
        HostConfig: {
          // Connect to the same network as other services
          NetworkMode: process.env.DOCKER_NETWORK || "mono_database_network",
          // Auto-remove container when it exits
          AutoRemove: true,
        },
      });

      this.runningContainers.set(taskId, container);

      logger.info(`Starting container for task: ${taskId} (${jobType})`);

      await container.start();

      // Attach to logs
      const stream = await container.logs({
        follow: true,
        stdout: true,
        stderr: true,
      });

      stream.on("data", (chunk) => {
        const output = chunk.toString("utf8");
        logger.info(`[${taskId}] ${output.trim()}`);
      });

      // Wait for container to finish
      const result = await container.wait();

      if (result.StatusCode !== 0) {
        throw new Error(
          `Container exited with code ${result.StatusCode}. Error: ${result.Error || "Unknown error"}`
        );
      }

      logger.info(`Container completed successfully for task: ${taskId}`);
    } catch (error) {
      logger.error(`Container execution error for task ${taskId}:`, error);
      throw error;
    } finally {
      this.runningContainers.delete(taskId);
    }
  }

  async cancelTask(params: CancelTaskParams): Promise<void> {
    const { taskId } = params;

    logger.info(`Canceling task: ${taskId}`);

    // Cancel scheduled timeout
    if (this.scheduledTasks.has(taskId)) {
      clearTimeout(this.scheduledTasks.get(taskId));
      this.scheduledTasks.delete(taskId);
      logger.info(`Scheduled task canceled`);
    }

    // Stop running container
    if (this.runningContainers.has(taskId)) {
      const container = this.runningContainers.get(taskId)!;
      try {
        await container.stop({ t: 10 }); // 10 second grace period
        logger.info(`Running container stopped`);
      } catch (error) {
        logger.error(`Error stopping container:`, error);
        // Try to kill if stop fails
        try {
          await container.kill();
        } catch (killError) {
          logger.error(`Error killing container:`, killError);
        }
      }
      this.runningContainers.delete(taskId);
    }

    if (
      !this.scheduledTasks.has(taskId) &&
      !this.runningContainers.has(taskId)
    ) {
      logger.warn(`Task not found or already completed: ${taskId}`);
    }
  }

  /**
   * Clear all scheduled tasks and stop running containers
   */
  async clearAll(): Promise<void> {
    for (const timeout of this.scheduledTasks.values()) {
      clearTimeout(timeout);
    }
    this.scheduledTasks.clear();

    const stopPromises = Array.from(this.runningContainers.values()).map(
      async (container) => {
        try {
          await container.stop({ t: 10 });
        } catch (error) {
          logger.error(`Error stopping container:`, error);
        }
      }
    );

    await Promise.all(stopPromises);
    this.runningContainers.clear();

    logger.info("All scheduled tasks cleared");
  }

  /**
   * Get count of scheduled tasks
   */
  getScheduledTaskCount(): number {
    return this.scheduledTasks.size;
  }
}
