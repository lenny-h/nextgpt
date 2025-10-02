import { getSignedUrlForUpload } from "@/src/utils/access-clients/google-storage-client.js";
import { type Context } from "hono";
import { getSignedUrlSchema } from "./schema.js";

// Get signed URL for uploading an attachment
export async function POST(c: Context) {
  const user = c.get("user");

  const payload = await c.req.json();

  const { filename, fileSize, fileType } = getSignedUrlSchema.parse(payload);

  const newFilename = user.id + "/" + filename;

  const signedUrl = await getSignedUrlForUpload({
    bucket: `${process.env.GOOGLE_VERTEX_PROJECT}-correction-bucket`,
    filename: newFilename,
    contentType: fileType,
    contentLength: fileSize,
  });

  return c.json({
    signedUrl,
    newFilename,
  });
}
