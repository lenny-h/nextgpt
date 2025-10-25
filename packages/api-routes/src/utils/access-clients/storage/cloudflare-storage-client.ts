import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { IStorageClient } from "../interfaces/storage-client.interface.js";

/**
 * Cloudflare R2 Storage implementation (S3-compatible)
 */
export class CloudflareStorageClient implements IStorageClient {
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

      const endpoint = process.env.R2_ENDPOINT;
      const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID;
      const secretAccessKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY;

      if (!endpoint || !accessKeyId || !secretAccessKey) {
        throw new Error(
          "R2_ENDPOINT, CLOUDFLARE_ACCESS_KEY_ID, and CLOUDFLARE_SECRET_ACCESS_KEY environment variables are required"
        );
      }

      this.s3Client = new S3Client({
        region: "auto",
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
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
