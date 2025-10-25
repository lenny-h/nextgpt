import {
  ITasksClient,
  TaskRequest,
} from "../interfaces/tasks-client.interface.js";

/**
 * Local tasks client for development
 * Executes HTTP requests directly with scheduling support
 */
export class LocalTasksClient implements ITasksClient {
  private scheduledTasks: Map<string, NodeJS.Timeout> = new Map();

  async createTask({
    parent,
    task,
  }: {
    parent: string;
    task: TaskRequest;
  }): Promise<{ name: string }> {
    const delay = Math.max(0, task.scheduleTime.seconds * 1000 - Date.now());

    console.log(`[LocalTasksClient] Task scheduled with delay: ${delay}ms`);
    console.log(`[LocalTasksClient] Target URL: ${task.httpRequest.url}`);
    console.log(`[LocalTasksClient] Queue: ${parent}`);

    // Clear any existing timeout with the same name
    if (this.scheduledTasks.has(task.name)) {
      clearTimeout(this.scheduledTasks.get(task.name)!);
    }

    // Execute after delay
    const timeout = setTimeout(async () => {
      try {
        const body = Buffer.from(task.httpRequest.body, "base64").toString(
          "utf-8"
        );
        console.log(`[LocalTasksClient] Executing task: ${task.name}`);

        const response = await fetch(task.httpRequest.url, {
          method: task.httpRequest.httpMethod,
          headers: task.httpRequest.headers,
          body: body,
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
        this.scheduledTasks.delete(task.name);
      }
    }, delay);

    // Store the timeout
    this.scheduledTasks.set(task.name, timeout);

    return { name: task.name };
  }

  async deleteTask({ name }: { name: string }): Promise<{ name: string }> {
    console.log(`[LocalTasksClient] Deleting task: ${name}`);

    if (this.scheduledTasks.has(name)) {
      clearTimeout(this.scheduledTasks.get(name)!);
      this.scheduledTasks.delete(name);
      console.log(`[LocalTasksClient] Task deleted successfully`);
    } else {
      console.warn(
        `[LocalTasksClient] Task not found or already executed: ${name}`
      );
    }

    return { name };
  }

  taskPath(
    project: string,
    location: string,
    queue: string,
    task: string
  ): string {
    return `projects/${project}/locations/${location}/queues/${queue}/tasks/${task}`;
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
