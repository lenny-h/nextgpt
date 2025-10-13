import { Storage } from "@google-cloud/storage";

// Track when the client was created
let storageInstance: Storage | null = null;
let clientCreationTime: number | null = null;

// Client expires after 1 hour to prevent stale connections
const CLIENT_MAX_AGE = 60 * 60 * 1000;

function getStorageClient(): Storage {
  const now = Date.now();

  if (
    !storageInstance ||
    !clientCreationTime ||
    now - clientCreationTime > CLIENT_MAX_AGE
  ) {
    if (storageInstance) {
      storageInstance = null;
    }

    storageInstance = new Storage();

    clientCreationTime = now;
  }

  return storageInstance;
}

export async function getSignedUrlForUpload({
  bucket,
  filename,
  contentType,
  contentLength,
}: {
  bucket: string;
  filename: string;
  contentType: string;
  contentLength: number;
}): Promise<string> {
  const storage = getStorageClient();
  const blob = storage.bucket(bucket).file(filename);

  const [signedUrl] = await blob.getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 1 * 60 * 1000, // 1 minute
    contentType: contentType,
    extensionHeaders: {
      "x-goog-content-length-range": `0,${contentLength}`, // Enforce max file size
    },
  });

  return signedUrl;
}

export function getCorrectionBucket() {
  const storage = getStorageClient();
  return storage.bucket(
    `${process.env.GOOGLE_VERTEX_PROJECT}-correction-bucket`
  );
}

export function getPagesBucket() {
  const storage = getStorageClient();
  return storage.bucket(`${process.env.GOOGLE_VERTEX_PROJECT}-pages-bucket`);
}
