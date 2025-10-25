import { ServiceBusClient, ServiceBusSender } from "@azure/service-bus";
import {
  ITasksClient,
  TaskRequest,
} from "../interfaces/tasks-client.interface.js";

/**
 * Azure Service Bus implementation for task queuing
 */
export class AzureTasksClient implements ITasksClient {
  private client: ServiceBusClient | null = null;
  private senders: Map<string, ServiceBusSender> = new Map();

  private getClient(): ServiceBusClient {
    if (!this.client) {
      const connectionString = process.env.SERVICE_BUS_CONNECTION_STRING;
      if (!connectionString) {
        throw new Error(
          "SERVICE_BUS_CONNECTION_STRING environment variable is required"
        );
      }
      this.client = new ServiceBusClient(connectionString);
    }
    return this.client;
  }

  private getSender(queueName: string): ServiceBusSender {
    if (!this.senders.has(queueName)) {
      const client = this.getClient();
      const sender = client.createSender(queueName);
      this.senders.set(queueName, sender);
    }
    return this.senders.get(queueName)!;
  }

  async createTask({
    parent,
    task,
  }: {
    parent: string;
    task: TaskRequest;
  }): Promise<{ name: string }> {
    // Extract queue name from parent path
    // Expected format: projects/{project}/locations/{location}/queues/{queue}
    const queueName = parent.split("/").pop() || "default-queue";

    const sender = this.getSender(queueName);

    // Calculate schedule time
    const scheduleTime = new Date(task.scheduleTime.seconds * 1000);

    // Send message
    await sender.sendMessages({
      body: {
        name: task.name,
        url: task.httpRequest.url,
        method: task.httpRequest.httpMethod,
        headers: task.httpRequest.headers,
        body: task.httpRequest.body,
      },
      scheduledEnqueueTimeUtc: scheduleTime,
      messageId: task.name,
    });

    return { name: task.name };
  }

  async deleteTask({ name }: { name: string }): Promise<{ name: string }> {
    // Azure Service Bus doesn't support deleting scheduled messages directly
    // Messages are automatically removed after processing or expiration
    console.warn(
      `[AzureTasksClient] Cannot delete scheduled message: ${name}. It will expire automatically.`
    );
    return { name };
  }

  taskPath(
    project: string,
    location: string,
    queue: string,
    task: string
  ): string {
    return `projects/${project}/locations/${location}/queues/${queue}/tasks/${task}`;
  }

  /**
   * Close all senders and the client
   */
  async close(): Promise<void> {
    for (const sender of this.senders.values()) {
      await sender.close();
    }
    this.senders.clear();

    if (this.client) {
      await this.client.close();
      this.client = null;
    }
  }
}
