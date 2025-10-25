import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { IStorageClient } from "../interfaces/storage-client.interface.js";

/**
 * Local MinIO Storage implementation (S3-compatible)
 */
export class LocalStorageClient implements IStorageClient {
  private s3Client: S3Client | null = null;
  private clientCreationTime: number | null = null;
  private readonly CLIENT_MAX_AGE = 60 * 60 * 1000; // 1 hour

  private getS3Client(): S3Client {
    const now = Date.now();

    if (
      !this.s3Client ||
      !this.clientCreationTime ||
      now - this.clientCreationTime > this.CLIENT_MAX_AGE
    ) {
      if (this.s3Client) {
        this.s3Client = null;
      }

      const endpoint = process.env.MINIO_ENDPOINT;
      const accessKeyId = process.env.MINIO_ACCESS_KEY!;
      const secretAccessKey = process.env.MINIO_SECRET_KEY!;

      if (!endpoint || !accessKeyId || !secretAccessKey) {
        throw new Error("MINIO_ENDPOINT environment variable is required");
      }

      // Ensure endpoint has protocol
      const formattedEndpoint = endpoint.startsWith("http")
        ? endpoint
        : `http://${endpoint}`;

      this.s3Client = new S3Client({
        region: "us-east-1", // MinIO uses this as default
        endpoint: formattedEndpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        forcePathStyle: true, // Required for MinIO
      });

      this.clientCreationTime = now;
    }

    return this.s3Client;
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
    const s3Client = this.getS3Client();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: contentLength,
    });

    return getSignedUrl(s3Client, command, { expiresIn: 65 });
  }

  async getSignedUrlForDownload({
    bucket,
    key,
  }: {
    bucket: string;
    key: string;
  }): Promise<string> {
    const s3Client = this.getS3Client();
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    return getSignedUrl(s3Client, command, {
      expiresIn: 180 * 60, // 3 hours
    });
  }

  async downloadFile({
    bucket,
    key,
  }: {
    bucket: string;
    key: string;
  }): Promise<Buffer> {
    const s3Client = this.getS3Client();
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3Client.send(command);
    
    if (!response.Body) {
      throw new Error(`File not found: ${bucket}/${key}`);
    }

    // Convert the stream to a Buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  }

  async deleteFile({
    bucket,
    key,
  }: {
    bucket: string;
    key: string;
  }): Promise<void> {
    const s3Client = this.getS3Client();
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await s3Client.send(command);
  }
}
