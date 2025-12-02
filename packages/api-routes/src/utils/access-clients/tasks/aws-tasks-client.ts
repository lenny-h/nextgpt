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
 * Uses EventBridge Rules with API Destinations for invoking HTTP endpoints
 * Scheduler puts events to a custom event bus, rules route to API Destinations
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

  /**
   * Maps endpoint paths to EventBridge detail-type values
   * These must match the event patterns in the EventBridge Rules
   */
  private getDetailType(endpoint: string): string {
    const detailTypeMap: Record<string, string> = {
      "/internal/process-pdf": "process-pdf",
      "/internal/process-document": "process-document",
    };

    const detailType = detailTypeMap[endpoint];
    if (!detailType) {
      throw new Error(
        `No detail-type configured for endpoint: ${endpoint}. ` +
          `Available endpoints: ${Object.keys(detailTypeMap).join(", ")}`
      );
    }

    return detailType;
  }

  async scheduleProcessingTask(
    params: ScheduleProcessingTaskParams
  ): Promise<void> {
    const { taskId, endpoint, payload, scheduleTime } = params;

    const schedulerClient = this.getSchedulerClient();

    const scheduleGroup = process.env.AWS_SCHEDULER_GROUP;
    const roleArn = process.env.AWS_SCHEDULER_ROLE_ARN;
    const eventBusArn = process.env.AWS_EVENTBRIDGE_BUS_ARN;

    if (!roleArn) {
      throw new Error(
        "AWS_SCHEDULER_ROLE_ARN environment variable is required"
      );
    }

    if (!eventBusArn) {
      throw new Error(
        "AWS_EVENTBRIDGE_BUS_ARN environment variable is required"
      );
    }

    // Get the detail-type for this endpoint (used by EventBridge Rules to route)
    const detailType = this.getDetailType(endpoint);

    // Convert schedule time to ISO 8601 format (AWS requires no milliseconds)
    const scheduleExpression = `at(${scheduleTime.toISOString().replace(/\.\d{3}Z$/, "")})`;

    const command = new CreateScheduleCommand({
      Name: taskId,
      GroupName: scheduleGroup,
      ScheduleExpression: scheduleExpression,
      FlexibleTimeWindow: {
        Mode: FlexibleTimeWindowMode.OFF,
      },
      Target: {
        // Target the EventBridge event bus
        Arn: eventBusArn,
        RoleArn: roleArn,
        // EventBridgeParameters for PutEvents
        EventBridgeParameters: {
          DetailType: detailType,
          Source: "nextgpt.scheduler",
        },
        // The payload is sent as the event detail
        Input: JSON.stringify(payload),
        // Retry configuration for transient failures
        RetryPolicy: {
          MaximumEventAgeInSeconds: 3600, // 1 hour
          MaximumRetryAttempts: 3,
        },
      },
      // Delete schedule after execution
      ActionAfterCompletion: "DELETE",
    });

    await schedulerClient.send(command);

    logger.info(
      `Scheduled processing task: ${taskId} for ${scheduleTime.toISOString()} (detail-type: ${detailType})`
    );
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
      logger.info(`Cancelled scheduled task: ${taskId}`);
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
