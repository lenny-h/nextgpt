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
 * Uses EventBridge Scheduler to trigger ECS RunTask for job-based processing
 * Supports delays up to 1 year and task deletion
 */
export class AwsTasksClient implements ITasksClient {
  private client: SchedulerClient | null = null;

  private getSchedulerClient(): SchedulerClient {
    if (!this.client) {
      this.client = new SchedulerClient();
    }
    return this.client;
  }

  async scheduleProcessingTask(
    params: ScheduleProcessingTaskParams
  ): Promise<void> {
    const { taskId, jobType, payload, scheduleTime } = params;

    const schedulerClient = this.getSchedulerClient();

    const scheduleGroup = process.env.AWS_SCHEDULER_GROUP;
    const roleArn = process.env.AWS_SCHEDULER_ROLE_ARN;

    const ecsClusterArn = process.env.AWS_ECS_CLUSTER_ARN;
    const ecsTaskDefinitionArn = process.env.AWS_ECS_TASK_DEFINITION_ARN;

    const subnetIds = process.env.AWS_SUBNET_IDS?.split(",") || [];
    const securityGroupIds =
      process.env.AWS_SECURITY_GROUP_IDS?.split(",") || [];

    if (!roleArn) {
      throw new Error(
        "AWS_SCHEDULER_ROLE_ARN environment variable is required"
      );
    }

    if (!ecsClusterArn) {
      throw new Error("AWS_ECS_CLUSTER_ARN environment variable is required");
    }

    if (!ecsTaskDefinitionArn) {
      throw new Error(
        "AWS_ECS_TASK_DEFINITION_ARN environment variable is required"
      );
    }

    if (subnetIds.length === 0) {
      throw new Error("AWS_SUBNET_IDS environment variable is required");
    }

    if (securityGroupIds.length === 0) {
      throw new Error(
        "AWS_SECURITY_GROUP_IDS environment variable is required"
      );
    }

    // Build environment variables from payload
    const environmentOverrides = [
      { name: "JOB_TYPE", value: jobType },
      { name: "TASK_ID", value: payload.taskId },
      { name: "BUCKET_ID", value: payload.bucketId },
      { name: "FILE_NAME", value: payload.name },
      { name: "FILE_SIZE", value: payload.size },
      { name: "CONTENT_TYPE", value: payload.contentType || "application/pdf" },
      {
        name: "PAGE_NUMBER_OFFSET",
        value: String(payload.pageNumberOffset || 0),
      },
    ];

    // Add pipeline options if present
    if (payload.pipelineOptions) {
      const opts = payload.pipelineOptions;
      if (opts.do_ocr !== undefined) {
        environmentOverrides.push({
          name: "DO_OCR",
          value: String(opts.do_ocr),
        });
      }
      if (opts.do_table_structure !== undefined) {
        environmentOverrides.push({
          name: "DO_TABLE_STRUCTURE",
          value: String(opts.do_table_structure),
        });
      }
      if (opts.do_formula_enrichment !== undefined) {
        environmentOverrides.push({
          name: "DO_FORMULA_ENRICHMENT",
          value: String(opts.do_formula_enrichment),
        });
      }
      if (opts.do_code_enrichment !== undefined) {
        environmentOverrides.push({
          name: "DO_CODE_ENRICHMENT",
          value: String(opts.do_code_enrichment),
        });
      }
      if (opts.do_picture_description !== undefined) {
        environmentOverrides.push({
          name: "DO_PICTURE_DESCRIPTION",
          value: String(opts.do_picture_description),
        });
      }
    }

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
        // Target ECS RunTask
        Arn: ecsClusterArn,
        RoleArn: roleArn,
        EcsParameters: {
          TaskDefinitionArn: ecsTaskDefinitionArn,
          TaskCount: 1,
          LaunchType: "FARGATE",
          NetworkConfiguration: {
            awsvpcConfiguration: {
              Subnets: subnetIds,
              SecurityGroups: securityGroupIds,
              AssignPublicIp: "DISABLED",
            },
          },
          PlatformVersion: "LATEST",
        },
        // Pass environment overrides as JSON input
        // ECS will merge these with the task definition
        Input: JSON.stringify({
          containerOverrides: [
            {
              name: "document-processor",
              environment: environmentOverrides,
            },
          ],
        }),
        // Retry configuration for transient failures
        RetryPolicy: {
          MaximumEventAgeInSeconds: 3600, // 1 hour
          MaximumRetryAttempts: 1,
        },
      },
      // Delete schedule after execution
      ActionAfterCompletion: "DELETE",
    });

    await schedulerClient.send(command);

    logger.info(
      `Scheduled ECS task: ${taskId} for ${scheduleTime.toISOString()} (job-type: ${jobType})`
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
