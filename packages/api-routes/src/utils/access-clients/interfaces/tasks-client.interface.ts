/**
 * Base interface for task queue clients
 * All task client implementations must implement these methods
 */

/**
 * Parameters for scheduling a processing task
 */
export interface ScheduleProcessingTaskParams {
  taskId: string;
  processorUrl: string;
  endpoint: string; // e.g., "/process-pdf" or "/process-document"
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
   * Schedule a processing task with high-level abstraction
   * Each implementation handles cloud-provider-specific details internally
   */
  scheduleProcessingTask(params: ScheduleProcessingTaskParams): Promise<void>;

  /**
   * Cancel a scheduled task
   * Each implementation handles cloud-provider-specific task identification
   */
  cancelTask(params: CancelTaskParams): Promise<void>;
}
