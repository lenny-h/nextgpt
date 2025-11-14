import { CloudTasksClient } from "@google-cloud/tasks";
import {
  CancelTaskParams,
  ITasksClient,
  ScheduleProcessingTaskParams,
} from "../interfaces/tasks-client.interface.js";

/**
 * Google Cloud Tasks implementation
 */
export class GoogleTasksClient implements ITasksClient {
  private client: CloudTasksClient;

  constructor() {
    this.client = new CloudTasksClient();
  }

  async scheduleProcessingTask(
    params: ScheduleProcessingTaskParams
  ): Promise<void> {
    const { taskId, processorUrl, endpoint, payload, scheduleTime } = params;

    const projectId = process.env.GOOGLE_VERTEX_PROJECT;
    const location = process.env.GOOGLE_VERTEX_LOCATION;
    const queue = process.env.GOOGLE_PROCESSING_QUEUE;
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

    const task = {
      name: fullTaskPath,
      httpRequest: {
        httpMethod: "POST" as const,
        url: `${processorUrl}${endpoint}`,
        headers: {
          "Content-Type": "application/json",
        },
        body: Buffer.from(JSON.stringify(payload)).toString("base64"),
        oidcToken: {
          serviceAccountEmail,
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
  }

  async cancelTask(params: CancelTaskParams): Promise<void> {
    const { taskId } = params;

    const projectId = process.env.CLOUD_PROJECT_ID;
    const location = process.env.GOOGLE_VERTEX_LOCATION;
    const queue = process.env.GOOGLE_PROCESSING_QUEUE;

    if (!projectId || !location || !queue) {
      throw new Error(
        "Missing required environment variables: CLOUD_PROJECT_ID, GOOGLE_VERTEX_LOCATION, or GOOGLE_PROCESSING_QUEUE"
      );
    }

    const fullTaskPath = this.client.taskPath(
      projectId,
      location,
      queue,
      taskId
    );

    await this.client.deleteTask({ name: fullTaskPath });
  }
}
