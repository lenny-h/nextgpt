import { CloudTasksClient } from "@google-cloud/tasks";

export interface Task {
  name: string;
  httpRequest: {
    httpMethod: string;
    url: string;
    headers: Record<string, string>;
    body: string;
    oidcToken?: {
      serviceAccountEmail: string;
    };
  };
  scheduleTime: {
    seconds: number;
  };
}

class LocalTasksClient {
  /**
   * Mock implementation for local development
   * Executes tasks immediately or after delay
   */
  async createTask(task: Task) {
    const delay = task.scheduleTime
      ? Math.max(0, task.scheduleTime.seconds * 1000 - Date.now())
      : 0;

    console.log(`[LocalTasksClient] Task scheduled with delay: ${delay}ms`);
    console.log(`[LocalTasksClient] Target URL: ${task.httpRequest.url}`);

    // Execute after delay
    setTimeout(async () => {
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
        } else {
          console.log(`[LocalTasksClient] Task completed successfully`);
        }
      } catch (error) {
        console.error(`[LocalTasksClient] Task execution error:`, error);
      }
    }, delay);

    return { name: task.name };
  }

  async deleteTask({ name }: { name: string }) {
    console.log(`[LocalTasksClient] Deleting task: ${name}`);
    console.warn(
      "[LocalTasksClient] Warning: Cannot delete tasks in local mode"
    );

    return { name };
  }

  taskPath(project: string, location: string, queue: string, task: string) {
    return `projects/${project}/locations/${location}/queues/${queue}/tasks/${task}`;
  }
}

export function getTasksClient(): CloudTasksClient {
  if (process.env.USE_LOCAL_TASKS === "true") {
    console.log("[TasksClient] Using local mock implementation");

    return new LocalTasksClient() as unknown as CloudTasksClient;
  }

  return new CloudTasksClient();
}
