import { CloudTasksClient } from "@google-cloud/tasks";
import {
  ITasksClient,
  ScheduleProcessingTaskParams,
  CancelTaskParams,
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
    const serviceAccountEmail = process.env.CLOUD_TASKS_SA;
    const queuePath = process.env.TASK_QUEUE_PATH;

    if (!projectId || !serviceAccountEmail || !queuePath) {
      throw new Error(
        "Missing required environment variables: GOOGLE_VERTEX_PROJECT, CLOUD_TASKS_SA, or TASK_QUEUE_PATH"
      );
    }

    const queuePathParts = queuePath.split("/");
    const location = queuePathParts[3];
    const queue = queuePathParts[queuePathParts.length - 1];

    const taskName = `process-${taskId}`;
    const fullTaskPath = this.client.taskPath(
      projectId,
      location,
      queue,
      taskName
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
    const queuePath = process.env.TASK_QUEUE_PATH;

    if (!projectId || !queuePath) {
      throw new Error(
        "Missing required environment variables: CLOUD_PROJECT_ID or TASK_QUEUE_PATH"
      );
    }

    const queuePathParts = queuePath.split("/");
    const location = queuePathParts[3];
    const queue = queuePathParts[queuePathParts.length - 1];

    const taskName = `process-${taskId}`;
    const fullTaskPath = this.client.taskPath(
      projectId,
      location,
      queue,
      taskName
    );

    await this.client.deleteTask({ name: fullTaskPath });
  }
}
