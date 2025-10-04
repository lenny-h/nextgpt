import { getSignedUrlForUpload } from "@/src/utils/access-clients/google-storage-client.js";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { getSignedUrlSchema } from "./schema.js";

const app = new Hono().post(
  "/",
  validator("json", async (value) => {
    return getSignedUrlSchema.parse(value);
  }),
  async (c) => {
    const { filename, fileSize, fileType } = c.req.valid("json");
    const user = c.get("user");

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
);

export default app;
