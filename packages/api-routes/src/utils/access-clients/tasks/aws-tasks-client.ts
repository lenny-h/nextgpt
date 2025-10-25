import {
  SchedulerClient,
  CreateScheduleCommand,
  DeleteScheduleCommand,
  FlexibleTimeWindowMode,
} from "@aws-sdk/client-scheduler";
import {
  ITasksClient,
  TaskRequest,
} from "../interfaces/tasks-client.interface.js";

/**
 * AWS EventBridge Scheduler implementation for task queuing
 * Supports delays up to 1 year and task deletion
 */
export class AwsTasksClient implements ITasksClient {
  private client: SchedulerClient | null = null;
  private clientCreationTime: number | null = null;
  private readonly CLIENT_MAX_AGE = 60 * 60 * 1000; // 1 hour

  private getSchedulerClient(): SchedulerClient {
    const now = Date.now();

    if (
      !this.client ||
      !this.clientCreationTime ||
      now - this.clientCreationTime > this.CLIENT_MAX_AGE
    ) {
      if (this.client) {
        this.client = null;
      }

      this.client = new SchedulerClient();

      this.clientCreationTime = now;
    }

    return this.client;
  }

  async createTask({
    parent,
    task,
  }: {
    parent: string;
    task: TaskRequest;
  }): Promise<void> {
    const schedulerClient = this.getSchedulerClient();

    // Extract queue/schedule group from parent
    const scheduleGroup = this.extractScheduleGroup(parent);

    // Convert schedule time to ISO 8601 format
    const scheduleTime = new Date(task.scheduleTime.seconds * 1000);
    const scheduleExpression = `at(${scheduleTime.toISOString().replace(/\.\d{3}Z$/, "")})`; // AWS requires no milliseconds

    // Get target ARN
    const targetArn = process.env.AWS_SCHEDULER_TARGET_ARN; // Target Amazon Resource Name
    const roleArn = process.env.AWS_SCHEDULER_ROLE_ARN; // IAM Role ARN with permissions to invoke the target

    if (!targetArn || !roleArn) {
      throw new Error(
        "AWS_SCHEDULER_TARGET_ARN and AWS_SCHEDULER_ROLE_ARN environment variables are required"
      );
    }

    const command = new CreateScheduleCommand({
      Name: task.name,
      GroupName: scheduleGroup,
      ScheduleExpression: scheduleExpression,
      FlexibleTimeWindow: {
        Mode: FlexibleTimeWindowMode.OFF,
      },
      Target: {
        Arn: targetArn,
        RoleArn: roleArn,
        Input: JSON.stringify({
          name: task.name,
          url: task.httpRequest.url,
          method: task.httpRequest.httpMethod,
          headers: task.httpRequest.headers,
          body: task.httpRequest.body,
        }),
      },
      // Delete schedule after execution
      ActionAfterCompletion: "DELETE",
    });

    await schedulerClient.send(command);
  }

  async deleteTask({ name }: { name: string }): Promise<void> {
    const schedulerClient = this.getSchedulerClient();
    const scheduleGroup = process.env.AWS_SCHEDULER_GROUP || "default";

    const command = new DeleteScheduleCommand({
      Name: name,
      GroupName: scheduleGroup,
    });

    try {
      await schedulerClient.send(command);
    } catch (error: any) {
      if (error.name === "ResourceNotFoundException") {
        console.warn(
          `[AwsTasksClient] Schedule not found: ${name}. It may have already been executed or deleted.`
        );
      } else {
        throw error;
      }
    }
  }

  taskPath(
    project: string,
    location: string,
    queue: string,
    task: string
  ): string {
    return `projects/${project}/locations/${location}/queues/${queue}/tasks/${task}`;
  }

  private extractScheduleGroup(parent: string): string {
    // Extract schedule group from parent path
    // Expected format: projects/{project}/locations/{location}/queues/{queue}
    const parts = parent.split("/");
    const queueName = parts[parts.length - 1];
    return queueName || process.env.AWS_SCHEDULER_GROUP || "default";
  }
}
