import * as z from "zod";

import { isCourseMaintainer } from "@workspace/api-routes/lib/db/queries/course-maintainers.js";
import { getBucketIdByCourseId } from "@workspace/api-routes/lib/db/queries/courses.js";
import {
  deleteFile,
  getFileDetails,
} from "@workspace/api-routes/lib/db/queries/files.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { getStorageClient } from "@workspace/api-routes/utils/access-clients/storage-client.js";
import { db } from "@workspace/server/drizzle/db.js";
import { chunks } from "@workspace/server/drizzle/schema.js";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const paramSchema = z.object({ fileId: uuidSchema }).strict();

const app = new Hono().delete(
  "/",
  validator("param", (value, c) => {
    const parsed = paramSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }
    return parsed.data;
  }),
  async (c) => {
    const { fileId } = c.req.valid("param");

    const user = c.get("user");

    const { courseId, name } = await getFileDetails({
      fileId,
    });
    const bucketId = await getBucketIdByCourseId({ courseId });

    const isMaintainer = await isCourseMaintainer({
      userId: user.id,
      courseId,
    });

    if (!isMaintainer) {
      throw new HTTPException(403, { message: "FORBIDDEN" });
    }

    const storageClient = getStorageClient();

    await db.delete(chunks).where(eq(chunks.fileId, fileId)); // Delete chunks from the database
    await deleteFile({
      bucketId,
      fileId,
    });

    await storageClient.deleteFile({
      bucket: "files-bucket",
      key: `${courseId}/${name}`,
    });

    return c.json({ name });
  }
);

export default app;
