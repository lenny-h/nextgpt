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

    console.log(`[LocalTasksClient] Task scheduled with delay: ${delay}ms`);
    console.log(`[LocalTasksClient] Target URL: ${url}`);
    console.log(`[LocalTasksClient] Task ID: ${taskId}`);

    // Clear any existing timeout with the same name
    if (this.scheduledTasks.has(taskId)) {
      clearTimeout(this.scheduledTasks.get(taskId)!);
    }

    // Execute after delay
    const timeout = setTimeout(async () => {
      try {
        console.log(`[LocalTasksClient] Executing task: ${taskId}`);

        // Create an AbortController for a reasonable timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30 * 60 * 1000); // 30 minutes; file processing can be long

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

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
        if (error instanceof Error && error.name === "AbortError") {
          console.error(`[LocalTasksClient] Task timed out after 10 minutes`);
        } else {
          console.error(`[LocalTasksClient] Task execution error:`, error);
        }
      } finally {
        this.scheduledTasks.delete(taskId);
      }
    }, delay);

    // Alternative version without timeout handling
    // const timeout = setTimeout(() => {
    //   console.log(`[LocalTasksClient] Executing task: ${taskId}`);

    //   // Fire and forget - don't await the fetch
    //   fetch(url, {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify(payload),
    //   })
    //     .then(async (response) => {
    //       if (!response.ok) {
    //         console.error(
    //           `[LocalTasksClient] Task failed: ${response.status} ${response.statusText}`
    //         );
    //         const errorBody = await response.text();
    //         console.error(`[LocalTasksClient] Error body:`, errorBody);
    //       } else {
    //         console.log(`[LocalTasksClient] Task completed successfully`);
    //       }
    //     })
    //     .catch((error) => {
    //       console.error(`[LocalTasksClient] Task execution error:`, error);
    //     });

    //   // Immediately remove from scheduled tasks since we've triggered it
    //   this.scheduledTasks.delete(taskId);
    // }, delay);

    // Store the timeout
    this.scheduledTasks.set(taskId, timeout);
  }

  async cancelTask(params: CancelTaskParams): Promise<void> {
    const { taskId } = params;

    console.log(`[LocalTasksClient] Canceling task: ${taskId}`);

    if (this.scheduledTasks.has(taskId)) {
      clearTimeout(this.scheduledTasks.get(taskId)!);
      this.scheduledTasks.delete(taskId);
      console.log(`[LocalTasksClient] Task canceled successfully`);
    } else {
      console.warn(
        `[LocalTasksClient] Task not found or already executed: ${taskId}`
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
