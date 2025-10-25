import { CloudTasksClient } from "@google-cloud/tasks";
import {
  ITasksClient,
  TaskRequest,
} from "../interfaces/tasks-client.interface.js";

/**
 * Google Cloud Tasks implementation
 */
export class GoogleTasksClient implements ITasksClient {
  private client: CloudTasksClient;

  constructor() {
    this.client = new CloudTasksClient();
  }

  async createTask({
    parent,
    task,
  }: {
    parent: string;
    task: TaskRequest;
  }): Promise<void> {
    await this.client.createTask({
      parent,
      task,
    });
  }

  async deleteTask({ name }: { name: string }): Promise<void> {
    await this.client.deleteTask({ name });
  }

  taskPath(
    project: string,
    location: string,
    queue: string,
    task: string
  ): string {
    return this.client.taskPath(project, location, queue, task);
  }
}
