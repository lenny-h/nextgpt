import http from "node:http";
import {
  CancelTaskParams,
  ITasksClient,
  ScheduleProcessingTaskParams,
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

        // Use native http module for proper timeout control
        const requestBody = JSON.stringify(payload);

        await new Promise<void>((resolve, reject) => {
          const req = http.request(
            url,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                // "Content-Length": Buffer.byteLength(requestBody),
              },
              timeout: 30 * 60 * 1000, // 30 minutes total timeout
            },
            (res) => {
              let responseBody = "";

              res.on("data", (chunk) => {
                responseBody += chunk;
              });

              res.on("end", () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                  console.log(`[LocalTasksClient] Task completed successfully`);
                  resolve();
                } else {
                  console.error(
                    `[LocalTasksClient] Task failed: ${res.statusCode} ${res.statusMessage}`
                  );
                  console.error(`[LocalTasksClient] Error body:`, responseBody);
                  reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                }
              });
            }
          );

          req.on("timeout", () => {
            req.destroy();
            console.error(`[LocalTasksClient] Task timed out after 30 minutes`);
            reject(new Error("Request timeout after 30 minutes"));
          });

          req.on("error", (error) => {
            console.error(`[LocalTasksClient] Task execution error:`, error);
            reject(error);
          });

          req.write(requestBody);
          req.end();
        });
      } catch (error) {
        console.error(`[LocalTasksClient] Task execution error:`, error);
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
