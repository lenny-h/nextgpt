import {
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY!,
  },
});

export async function downloadFromS3(
  bucket: string,
  key: string
): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const response = await s3Client.send(command);
  if (!response.Body) {
    throw new Error("Empty response body from S3");
  }

  if (response.Body instanceof Readable) {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      (response.Body as Readable)
        .on("data", (chunk) => chunks.push(Buffer.from(chunk)))
        .on("error", (err) => reject(err))
        .on("end", () => resolve(Buffer.concat(chunks)));
    });
  } else {
    // Fallback or error for unexpected body type
    throw new Error("Unsupported S3 response body type");
  }
}

export async function deleteFileFromS3(
  bucket: string,
  key: string
): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await s3Client.send(command);
}
