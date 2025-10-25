import { IStorageClient } from "./interfaces/storage-client.interface.js";
import { AwsStorageClient } from "./storage/aws-storage-client.js";
import { CloudflareStorageClient } from "./storage/cloudflare-storage-client.js";
import { GoogleStorageClient } from "./storage/google-storage-client.js";
import { LocalStorageClient } from "./storage/local-storage-client.js";

let storageClientInstance: IStorageClient | null = null;

/**
 * Factory function to get the appropriate storage client based on environment variables
 * Priority order:
 * 1. Local storage (MinIO) if USE_LOCAL_FILE_STORAGE=true
 * 2. Cloudflare R2 if USE_CLOUDFLARE_R2=true
 * 3. Cloud provider based on CLOUD_PROVIDER env variable
 */
export function getStorageClient(): IStorageClient {
  if (storageClientInstance) {
    return storageClientInstance;
  }

  // Check for local storage first
  if (process.env.USE_LOCAL_FILE_STORAGE === "true") {
    console.log("[StorageClient] Using Local MinIO storage");
    storageClientInstance = new LocalStorageClient();
    return storageClientInstance;
  }

  // Check for Cloudflare R2
  if (process.env.USE_CLOUDFLARE_R2 === "true") {
    console.log("[StorageClient] Using Cloudflare R2 storage");
    storageClientInstance = new CloudflareStorageClient();
    return storageClientInstance;
  }

  // Determine cloud provider
  const cloudProvider = process.env.CLOUD_PROVIDER?.toLowerCase();

  switch (cloudProvider) {
    case "gcloud":
      console.log("[StorageClient] Using Google Cloud Storage");
      storageClientInstance = new GoogleStorageClient();
      break;

    case "azure":
      console.warn(
        "[StorageClient] Azure Storage is currently not supported. Using Local MinIO storage instead."
      );
      storageClientInstance = new LocalStorageClient();
      break;

    case "aws":
      console.log("[StorageClient] Using AWS S3 Storage");
      storageClientInstance = new AwsStorageClient();
      break;

    default:
      // Default to Google Cloud Storage if not specified
      console.error(
        `[StorageClient] Unsupported CLOUD_PROVIDER ${cloudProvider} specified.`
      );
      throw new Error(`Unsupported CLOUD_PROVIDER ${cloudProvider} specified.`);
  }

  return storageClientInstance;
}

/**
 * Reset the storage client instance (useful for testing or configuration changes)
 */
export function resetStorageClient(): void {
  storageClientInstance = null;
}
