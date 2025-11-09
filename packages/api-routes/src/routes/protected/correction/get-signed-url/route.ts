import { getStorageClient } from "@workspace/api-routes/utils/access-clients/storage-client.js";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { getSignedUrlBaseSchema } from "../../get-signed-url/[courseId]/schema.js";

const app = new Hono().post(
  "/",
  validator("json", async (value, c) => {
    const parsed = getSignedUrlBaseSchema.safeParse(value);
    if (!parsed.success) {
      return c.text("BAD_REQUEST", 400);
    }
    return parsed.data;
  }),
  async (c) => {
    const { filename, fileSize } = c.req.valid("json");
    const user = c.get("user");

    const newFilename = `${user.id}/${filename}`;

    const storageClient = getStorageClient();

    const signedUrl = await storageClient.getSignedUrlForUpload({
      bucket: "temporary-files-bucket",
      key: newFilename,
      contentType: "application/pdf",
      contentLength: fileSize,
    });

    return c.json({
      signedUrl,
      newFilename,
    });
  }
);

export default app;
