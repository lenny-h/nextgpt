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
 * Uses API Destinations for invoking HTTP endpoints
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

  private getApiDestinationArn(endpoint: string): string {
    // Map endpoints to their corresponding API Destination ARNs
    const apiDestinationArns: Record<string, string | undefined> = {
      "/internal/process-pdf": process.env.AWS_API_DESTINATION_PROCESS_PDF_ARN,
      "/internal/process-document":
        process.env.AWS_API_DESTINATION_PROCESS_DOCUMENT_ARN,
    };

    const arn = apiDestinationArns[endpoint];
    if (!arn) {
      throw new Error(
        `No API Destination ARN configured for endpoint: ${endpoint}. ` +
          `Available endpoints: ${Object.keys(apiDestinationArns).join(", ")}`
      );
    }

    return arn;
  }

  async scheduleProcessingTask(
    params: ScheduleProcessingTaskParams
  ): Promise<void> {
    const { taskId, endpoint, payload, scheduleTime } = params;

    const schedulerClient = this.getSchedulerClient();

    const scheduleGroup = process.env.AWS_SCHEDULER_GROUP;
    const roleArn = process.env.AWS_SCHEDULER_ROLE_ARN;

    if (!roleArn) {
      throw new Error(
        "AWS_SCHEDULER_ROLE_ARN environment variable is required"
      );
    }

    // Get the API Destination ARN for this endpoint
    const apiDestinationArn = this.getApiDestinationArn(endpoint);

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
        Arn: apiDestinationArn,
        RoleArn: roleArn,
        // The payload is sent as the request body to the API Destination
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
      `Scheduled processing task: ${taskId} for ${scheduleTime.toISOString()}`
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
