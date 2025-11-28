import { getStorageClient } from "@workspace/api-routes/utils/access-clients/storage-client.js";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { getSignedUrlSchema } from "./schema.js";

const app = new Hono().post(
  "/",
  validator("json", async (value, c) => {
    const parsed = getSignedUrlSchema.safeParse(value);
    if (!parsed.success) {
      // Check if the error is related to the filename field
      const filenameError = parsed.error.issues.find((issue) =>
        issue.path.includes("filename")
      );
      if (filenameError) {
        return c.text("INVALID_FILENAME", 400);
      }
      return c.text("BAD_REQUEST", 400);
    }
    return parsed.data;
  }),
  async (c) => {
    const { filename, fileSize, fileType } = c.req.valid("json");
    const user = c.get("user");

    const newFilename = `${user.id}/${filename}`;

    const storageClient = getStorageClient();

    const { url: signedUrl, headers } =
      await storageClient.getSignedUrlForUpload({
        bucket: "temporary-files-bucket",
        key: newFilename,
        contentType: fileType,
        contentLength: fileSize,
      });

    return c.json({
      signedUrl,
      headers,
      newFilename,
    });
  }
);

export default app;
