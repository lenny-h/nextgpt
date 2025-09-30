import { getSignedUrlForUpload } from "@/src/utils/access-clients/google-storage-client.js";
import { type Context } from "hono";
import { getSignedUrlSchema } from "./schema.js";

export async function POST(c: Context) {
  // Get user from auth middleware context
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
