import * as z from "zod";

import { getBucketIdByCourseId } from "@workspace/api-routes/lib/db/queries/courses.js";
import { filenameSchema } from "@workspace/api-routes/schemas/filename-schema.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { getStorageClient } from "@workspace/api-routes/utils/access-clients/storage-client.js";
import { userHasPermissions } from "@workspace/api-routes/utils/user-has-permissions.js";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const paramSchema = z
  .object({
    courseId: uuidSchema,
    name: z.string(),
  })
  .strict();

const app = new Hono().get(
  "/",
  validator("param", (value, c) => {
    const parsed = paramSchema.safeParse(value);
    if (!parsed.success) {
      return c.text("BAD_REQUEST", 400);
    }
    return parsed.data;
  }),
  async (c) => {
    const user = c.get("user");
    const { courseId, name } = c.req.valid("param");
    const filename = filenameSchema.parse(decodeURIComponent(name));

    const bucketId = await getBucketIdByCourseId({ courseId });

    const hasPermission = await userHasPermissions({
      userId: user.id,
      filterBucketId: bucketId,
      filterCourseIds: [courseId],
      filterFileIds: [],
      filterAttachments: [],
    });

    if (!hasPermission) {
      throw new HTTPException(403, { message: "FORBIDDEN" });
    }

    const storageClient = getStorageClient();

    const signedUrl = await storageClient.getSignedUrlForDownload({
      bucket: "files-bucket",
      key: `${courseId}/${filename}`,
    });

    return c.json({
      signedUrl,
    });
  }
);

export default app;
