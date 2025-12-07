import { Storage } from "@google-cloud/storage";
import { HTTPException } from "hono/http-exception";
import { IStorageClient } from "../interfaces/storage-client.interface.js";

/**
 * Google Cloud Storage implementation
 */
export class GoogleStorageClient implements IStorageClient {
  private storage: Storage | null = null;

  private getStorageClient(): Storage {
    if (!this.storage) {
      this.storage = new Storage();
    }

    return this.storage;
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
    const storage = this.getStorageClient();
    const blob = storage
      .bucket(`${process.env.GOOGLE_VERTEX_PROJECT}-${bucket}`)
      .file(key);

    const [signedUrl] = await blob.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 1 * 60 * 1000, // 1 minute
      contentType: contentType,
      extensionHeaders: {
        "x-goog-content-length-range": `0,${contentLength}`,
      },
    });

    return {
      url: signedUrl,
      headers: {
        "x-goog-content-length-range": `0,${contentLength}`,
      },
    };
  }

  async getSignedUrlForDownload({
    bucket,
    key,
  }: {
    bucket: string;
    key: string;
  }): Promise<string> {
    const storage = this.getStorageClient();
    const blob = storage
      .bucket(`${process.env.GOOGLE_VERTEX_PROJECT}-${bucket}`)
      .file(key);

    const [signedUrl] = await blob.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 180 * 60 * 1000, // 3 hours
    });

    return signedUrl;
  }

  async downloadFile({
    bucket,
    key,
  }: {
    bucket: string;
    key: string;
  }): Promise<Buffer> {
    const storage = this.getStorageClient();
    const blob = storage
      .bucket(`${process.env.GOOGLE_VERTEX_PROJECT}-${bucket}`)
      .file(key);

    const [content] = await blob.download();
    return content;
  }

  async deleteFile({
    bucket,
    key,
  }: {
    bucket: string;
    key: string;
  }): Promise<void> {
    try {
      const storage = this.getStorageClient();
      await storage
        .bucket(`${process.env.GOOGLE_VERTEX_PROJECT}-${bucket}`)
        .file(key)
        .delete();
    } catch (error: any) {
      if (error.code === 404) {
        throw new HTTPException(404, { message: `File not found: ${key}` });
      }
      throw error;
    }
  }
}
