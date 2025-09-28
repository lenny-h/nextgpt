import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Track when the client was created
let s3ClientInstance: S3Client | null = null;
let clientCreationTime: number | null = null;

// Client expires after 1 hour to prevent stale connections
const CLIENT_MAX_AGE = 60 * 60 * 1000;

function getS3Client(): S3Client {
  const now = Date.now();

  if (
    !s3ClientInstance ||
    !clientCreationTime ||
    now - clientCreationTime > CLIENT_MAX_AGE
  ) {
    if (s3ClientInstance) {
      s3ClientInstance = null;
    }

    s3ClientInstance = new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
        secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY!,
      },
    });

    clientCreationTime = now;
  }

  return s3ClientInstance;
}

export async function getSignedUrlForDownload({
  bucket,
  key,
}: {
  bucket: string;
  key: string;
}) {
  const s3Client = getS3Client();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(s3Client, command, {
    expiresIn: 180 * 60, // 3 hours
  });
}

export async function getSignedUrlForUpload({
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
  const s3Client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 65 });
}

export async function deleteFileFromS3({
  bucket,
  key,
}: {
  bucket: string;
  key: string;
}): Promise<void> {
  const s3Client = getS3Client();

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await s3Client.send(command);
}
