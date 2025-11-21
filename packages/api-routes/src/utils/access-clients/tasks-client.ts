import { createLogger } from "@workspace/server/logger.js";
import { ITasksClient } from "./interfaces/tasks-client.interface.js";
import { AwsTasksClient } from "./tasks/aws-tasks-client.js";
import { GoogleTasksClient } from "./tasks/google-tasks-client.js";
import { LocalTasksClient } from "./tasks/local-tasks-client.js";

const logger = createLogger("tasks-client");

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
    logger.info("Using local mock implementation");
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
      logger.warn(
        "Azure is currently not supported. Using local mock implementation instead."
      );
      tasksClientInstance = new LocalTasksClient();
      break;

    case "aws":
      tasksClientInstance = new AwsTasksClient();
      break;

    default:
      // Default to local tasks client if not specified
      logger.error(`Unsupported CLOUD_PROVIDER ${cloudProvider} specified.`);
      throw new Error(`Unsupported CLOUD_PROVIDER ${cloudProvider} specified.`);
  }

  return tasksClientInstance;
}

/**
 * Reset the tasks client instance (useful for testing or configuration changes)
 */
export function resetTasksClient(): void {
  tasksClientInstance = null;
}
