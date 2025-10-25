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
  }): Promise<{ name: string }> {
    const [response] = await this.client.createTask({
      parent,
      task,
    });

    return { name: response.name || task.name };
  }

  async deleteTask({ name }: { name: string }): Promise<{ name: string }> {
    await this.client.deleteTask({ name });
    return { name };
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
