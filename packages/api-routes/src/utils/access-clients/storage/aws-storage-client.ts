import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { IStorageClient } from "../interfaces/storage-client.interface.js";

/**
 * AWS S3 Storage implementation
 */
export class AwsStorageClient implements IStorageClient {
  private s3Client: S3Client | null = null;

  private getS3Client(): S3Client {
    if (!this.s3Client) {
      // Use explicit credentials if provided; otherwise let SDK use default provider chain.
      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        this.s3Client = new S3Client({
          region: process.env.AWS_REGION,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          },
        });
      } else {
        this.s3Client = new S3Client();
      }
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
  }): Promise<{ url: string; headers: Record<string, string> }> {
    const s3Client = this.getS3Client();
    const command = new PutObjectCommand({
      Bucket: `${process.env.AWS_PROJECT_NAME}-${bucket}`,
      Key: key,
      ContentType: contentType,
      ContentLength: contentLength,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 65 }); // 65 seconds
    return { url: signedUrl, headers: {} };
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
      Bucket: `${process.env.AWS_PROJECT_NAME}-${bucket}`,
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
      Bucket: `${process.env.AWS_PROJECT_NAME}-${bucket}`,
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
      Bucket: `${process.env.AWS_PROJECT_NAME}-${bucket}`,
      Key: key,
    });

    await s3Client.send(command);
  }
}
