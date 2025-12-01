import {
  CreateScheduleCommand,
  DeleteScheduleCommand,
  FlexibleTimeWindowMode,
  SchedulerClient,
} from "@aws-sdk/client-scheduler";
import { createLogger } from "@workspace/server/logger.js";
import {
  CancelTaskParams,
  ITasksClient,
  ScheduleProcessingTaskParams,
} from "../interfaces/tasks-client.interface.js";

const logger = createLogger("aws-tasks-client");

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

  async scheduleProcessingTask(
    params: ScheduleProcessingTaskParams
  ): Promise<void> {
    const { taskId, processorUrl, endpoint, payload, scheduleTime } = params;

    const schedulerClient = this.getSchedulerClient();

    const scheduleGroup = process.env.AWS_SCHEDULER_GROUP;
    const roleArn = process.env.AWS_SCHEDULER_ROLE_ARN;

    if (!roleArn) {
      throw new Error(
        "AWS_SCHEDULER_ROLE_ARN environment variable is required"
      );
    }

    // Convert schedule time to ISO 8601 format
    const scheduleExpression = `at(${scheduleTime.toISOString().replace(/\.\d{3}Z$/, "")})`; // AWS requires no milliseconds

    // Construct the full URL for the HTTP target
    const targetUrl = `${processorUrl}${endpoint}`;

    const command = new CreateScheduleCommand({
      Name: taskId,
      GroupName: scheduleGroup,
      ScheduleExpression: scheduleExpression,
      FlexibleTimeWindow: {
        Mode: FlexibleTimeWindowMode.OFF,
      },
      Target: {
        // Use Universal Target ARN for HTTP endpoints
        Arn: "arn:aws:scheduler:::aws-sdk:scheduler:invokeHttpEndpoint",
        RoleArn: roleArn,
        Input: JSON.stringify({
          HttpParameters: {
            Method: "POST",
            Url: targetUrl,
            HeaderParameters: {
              "Content-Type": "application/json",
            },
            Body: JSON.stringify(payload),
          },
        }),
      },
      // Delete schedule after execution
      ActionAfterCompletion: "DELETE",
    });

    await schedulerClient.send(command);
  }

  async cancelTask(params: CancelTaskParams): Promise<void> {
    const { taskId } = params;

    const schedulerClient = this.getSchedulerClient();
    const scheduleGroup = process.env.AWS_SCHEDULER_GROUP;

    const command = new DeleteScheduleCommand({
      Name: taskId,
      GroupName: scheduleGroup,
    });

    try {
      await schedulerClient.send(command);
    } catch (error: any) {
      if (error.name === "ResourceNotFoundException") {
        logger.warn(
          `Schedule not found: ${taskId}. It may have already been executed or deleted.`
        );
      } else {
        throw error;
      }
    }
  }
}
