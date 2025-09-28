import { type Context } from "hono";
import { getSignedUrlForUpload } from "../../../../utils/access-clients/google-storage-client.js";
import { getSignedUrlSchema } from "../../get-signed-url/[courseId]/schema.js";

export async function POST(c: Context) {
  const payload = await c.req.json();

  const { filename, fileSize } = getSignedUrlSchema.parse(payload);

  const user = c.get("user");

  const newFilename = user.id + "/" + filename;

  const signedUrl = await getSignedUrlForUpload({
    bucket: `${process.env.GOOGLE_VERTEX_PROJECT}-correction-bucket`,
    filename: newFilename,
    contentType: "application/pdf",
    contentLength: fileSize,
  });

  return c.json({
    signedUrl,
    newFilename,
  });
}
