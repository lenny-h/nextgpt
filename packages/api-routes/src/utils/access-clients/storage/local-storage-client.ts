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
  private publicS3Client: S3Client | null = null;

  private getS3Client(): S3Client {
    if (!this.s3Client) {
      this.initializeClients();
    }

    return this.s3Client!;
  }

  private getPublicS3Client(): S3Client {
    if (!this.publicS3Client) {
      this.initializeClients();
    }

    return this.publicS3Client!;
  }

  private initializeClients() {
    if (this.s3Client) this.s3Client = null;
    if (this.publicS3Client) this.publicS3Client = null;

    const endpoint = process.env.MINIO_ENDPOINT;
    const publicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT || endpoint;
    const accessKeyId = process.env.MINIO_ROOT_USER;
    const secretAccessKey = process.env.MINIO_ROOT_PASSWORD;

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "MINIO_ENDPOINT, MINIO_ROOT_USER, or MINIO_ROOT_PASSWORD not configured"
      );
    }

    const clientConfig = {
      region: "us-east-1", // MinIO uses this as default
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true, // Required for MinIO
    };

    this.s3Client = new S3Client({
      ...clientConfig,
      endpoint,
    });

    this.publicS3Client = new S3Client({
      ...clientConfig,
      endpoint: publicEndpoint,
    });
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
    const s3Client = this.getPublicS3Client();
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
    const s3Client = this.getPublicS3Client();
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
      throw new Error(`File not found: ${key}`);
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
