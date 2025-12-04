/**
 * Base interface for task queue clients
 * All task client implementations must implement these methods
 */

/**
 * Job types for document processing
 */
export type JobType = "process-pdf" | "process-document";

/**
 * Parameters for scheduling a processing task/job
 */
export interface ScheduleProcessingTaskParams {
  taskId: string;
  jobType: JobType;
  payload: Record<string, any>;
  scheduleTime: Date;
}

/**
 * Parameters for canceling a scheduled task
 */
export interface CancelTaskParams {
  taskId: string;
}

export interface ITasksClient {
  /**
   * Schedule a processing task/job with high-level abstraction
   * Each implementation handles cloud-provider-specific details internally
   */
  scheduleProcessingTask(params: ScheduleProcessingTaskParams): Promise<void>;

  /**
   * Cancel a scheduled task
   * Each implementation handles cloud-provider-specific task identification
   */
  cancelTask(params: CancelTaskParams): Promise<void>;
}
