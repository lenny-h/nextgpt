/**
 * Base interface for task queue clients
 * All task client implementations must implement these methods
 */
export interface TaskRequest {
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

export interface ITasksClient {
  /**
   * Create a task in the queue
   */
  createTask(params: {
    parent: string;
    task: TaskRequest;
  }): Promise<{ name: string }>;

  /**
   * Delete a task from the queue
   */
  deleteTask(params: { name: string }): Promise<{ name: string }>;

  /**
   * Generate a task path/name
   */
  taskPath(
    project: string,
    location: string,
    queue: string,
    task: string
  ): string;
}
