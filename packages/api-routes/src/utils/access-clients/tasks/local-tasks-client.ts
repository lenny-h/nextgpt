import {
  ITasksClient,
  ScheduleProcessingTaskParams,
  CancelTaskParams,
} from "../interfaces/tasks-client.interface.js";

/**
 * Local tasks client for development
 * Executes HTTP requests directly with scheduling support
 */
export class LocalTasksClient implements ITasksClient {
  private scheduledTasks: Map<string, NodeJS.Timeout> = new Map();

  async scheduleProcessingTask(
    params: ScheduleProcessingTaskParams
  ): Promise<void> {
    const { taskId, processorUrl, endpoint, payload, scheduleTime } = params;

    const delay = Math.max(0, scheduleTime.getTime() - Date.now());
    const url = `${processorUrl}${endpoint}`;
    const taskName = `process-${taskId}`;

    console.log(`[LocalTasksClient] Task scheduled with delay: ${delay}ms`);
    console.log(`[LocalTasksClient] Target URL: ${url}`);
    console.log(`[LocalTasksClient] Task ID: ${taskId}`);

    // Clear any existing timeout with the same name
    if (this.scheduledTasks.has(taskName)) {
      clearTimeout(this.scheduledTasks.get(taskName)!);
    }

    // Execute after delay
    const timeout = setTimeout(async () => {
      try {
        console.log(`[LocalTasksClient] Executing task: ${taskName}`);

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          console.error(
            `[LocalTasksClient] Task failed: ${response.status} ${response.statusText}`
          );
          const errorBody = await response.text();
          console.error(`[LocalTasksClient] Error body:`, errorBody);
        } else {
          console.log(`[LocalTasksClient] Task completed successfully`);
        }
      } catch (error) {
        console.error(`[LocalTasksClient] Task execution error:`, error);
      } finally {
        // Remove from scheduled tasks
        this.scheduledTasks.delete(taskName);
      }
    }, delay);

    // Store the timeout
    this.scheduledTasks.set(taskName, timeout);
  }

  async cancelTask(params: CancelTaskParams): Promise<void> {
    const { taskId } = params;
    const taskName = `process-${taskId}`;

    console.log(`[LocalTasksClient] Canceling task: ${taskName}`);

    if (this.scheduledTasks.has(taskName)) {
      clearTimeout(this.scheduledTasks.get(taskName)!);
      this.scheduledTasks.delete(taskName);
      console.log(`[LocalTasksClient] Task canceled successfully`);
    } else {
      console.warn(
        `[LocalTasksClient] Task not found or already executed: ${taskName}`
      );
    }
  }

  /**
   * Clear all scheduled tasks
   */
  clearAll(): void {
    for (const timeout of this.scheduledTasks.values()) {
      clearTimeout(timeout);
    }
    this.scheduledTasks.clear();
    console.log("[LocalTasksClient] All scheduled tasks cleared");
  }

  /**
   * Get count of scheduled tasks
   */
  getScheduledTaskCount(): number {
    return this.scheduledTasks.size;
  }
}
