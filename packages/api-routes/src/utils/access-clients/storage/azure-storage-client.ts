import {
  BlobSASPermissions,
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from "@azure/storage-blob";
import { IStorageClient } from "../interfaces/storage-client.interface.js";

/**
 * Azure Blob Storage implementation
 */
export class AzureStorageClient implements IStorageClient {
  private blobServiceClient: BlobServiceClient | null = null;
  private clientCreationTime: number | null = null;
  private readonly CLIENT_MAX_AGE = 60 * 60 * 1000; // 1 hour

  private getBlobServiceClient(): BlobServiceClient {
    const now = Date.now();

    if (
      !this.blobServiceClient ||
      !this.clientCreationTime ||
      now - this.clientCreationTime > this.CLIENT_MAX_AGE
    ) {
      const account = process.env.AZURE_STORAGE_ACCOUNT_NAME;
      const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

      if (!account || !accountKey) {
        throw new Error(
          "AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY environment variables are required"
        );
      }

      const sharedKeyCredential = new StorageSharedKeyCredential(
        account,
        accountKey
      );

      this.blobServiceClient = new BlobServiceClient(
        `https://${account}.blob.core.windows.net`,
        sharedKeyCredential
      );

      this.clientCreationTime = now;
    }

    return this.blobServiceClient;
  }

  async getSignedUrlForUpload({
    bucket,
    key,
    contentType,
    contentLength,
  }: {
    bucket: string;
    key: string;
    contentType: string;
    contentLength: number;
  }): Promise<string> {
    const blobServiceClient = this.getBlobServiceClient();
    const containerClient = blobServiceClient.getContainerClient(bucket);
    const blobClient = containerClient.getBlobClient(key);

    const sharedKeyCredential = new StorageSharedKeyCredential(
      process.env.AZURE_STORAGE_ACCOUNT_NAME!,
      process.env.AZURE_STORAGE_ACCOUNT_KEY!
    );

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: bucket,
        blobName: key,
        permissions: BlobSASPermissions.parse("w"), // write permission
        startsOn: new Date(),
        expiresOn: new Date(Date.now() + 65 * 1000), // 65 seconds
        contentType,
      },
      sharedKeyCredential
    ).toString();

    return `${blobClient.url}?${sasToken}`;
  }

  async getSignedUrlForDownload({
    bucket,
    key,
  }: {
    bucket: string;
    key: string;
  }): Promise<string> {
    const blobServiceClient = this.getBlobServiceClient();
    const containerClient = blobServiceClient.getContainerClient(bucket);
    const blobClient = containerClient.getBlobClient(key);

    const sharedKeyCredential = new StorageSharedKeyCredential(
      process.env.AZURE_STORAGE_ACCOUNT_NAME!,
      process.env.AZURE_STORAGE_ACCOUNT_KEY!
    );

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: bucket,
        blobName: key,
        permissions: BlobSASPermissions.parse("r"), // read permission
        startsOn: new Date(),
        expiresOn: new Date(Date.now() + 180 * 60 * 1000), // 3 hours
      },
      sharedKeyCredential
    ).toString();

    return `${blobClient.url}?${sasToken}`;
  }

  async deleteFile({
    bucket,
    key,
  }: {
    bucket: string;
    key: string;
  }): Promise<void> {
    const blobServiceClient = this.getBlobServiceClient();
    const containerClient = blobServiceClient.getContainerClient(bucket);
    const blobClient = containerClient.getBlobClient(key);

    await blobClient.delete();
  }
}
