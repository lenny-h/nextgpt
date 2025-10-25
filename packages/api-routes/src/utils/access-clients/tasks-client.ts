import { ITasksClient } from "./interfaces/tasks-client.interface.js";
import { AwsTasksClient } from "./tasks/aws-tasks-client.js";
import { GoogleTasksClient } from "./tasks/google-tasks-client.js";
import { LocalTasksClient } from "./tasks/local-tasks-client.js";

let tasksClientInstance: ITasksClient | null = null;

/**
 * Factory function to get the appropriate tasks client based on environment variables
 **/
export function getTasksClient(): ITasksClient {
  if (tasksClientInstance) {
    return tasksClientInstance;
  }

  // Check for local tasks client
  const isLocal = process.env.USE_LOCAL_TASKS_CLIENT === "true";

  if (isLocal) {
    console.log("[TasksClient] Using local mock implementation");
    tasksClientInstance = new LocalTasksClient();
    return tasksClientInstance;
  }

  // Determine cloud provider
  const cloudProvider = process.env.CLOUD_PROVIDER?.toLowerCase();

  switch (cloudProvider) {
    case "gcloud":
      tasksClientInstance = new GoogleTasksClient();
      break;

    case "azure":
      console.warn(
        "[TasksClient] Azure is currently not supported. Using local mock implementation instead."
      );
      tasksClientInstance = new LocalTasksClient();
      break;

    case "aws":
      tasksClientInstance = new AwsTasksClient();
      break;

    default:
      // Default to local tasks client if not specified
      console.warn(
        "[TasksClient] No CLOUD_PROVIDER specified, using local mock implementation"
      );
      tasksClientInstance = new LocalTasksClient();
  }

  return tasksClientInstance;
}

/**
 * Reset the tasks client instance (useful for testing or configuration changes)
 */
export function resetTasksClient(): void {
  tasksClientInstance = null;
}
