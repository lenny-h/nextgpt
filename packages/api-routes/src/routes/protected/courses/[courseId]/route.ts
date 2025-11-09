import * as z from "zod";

import { isBucketMaintainer } from "@workspace/api-routes/lib/db/queries/bucket-maintainers.js";
import {
  deleteCourse,
  getBucketIdByCourseId,
} from "@workspace/api-routes/lib/db/queries/courses.js";
import {
  deleteFile,
  getCourseFiles,
} from "@workspace/api-routes/lib/db/queries/files.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { getStorageClient } from "@workspace/api-routes/utils/access-clients/storage-client.js";
import { db } from "@workspace/server/drizzle/db.js";
import { pages } from "@workspace/server/drizzle/schema.js";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const paramSchema = z.object({ courseId: uuidSchema }).strict();

const app = new Hono().delete(
  "/",
  validator("param", (value, c) => {
    const parsed = paramSchema.safeParse(value);
    if (!parsed.success) {
      return c.text("BAD_REQUEST", 400);
    }
    return parsed.data;
  }),
  async (c) => {
    const { courseId } = c.req.valid("param");

    const user = c.get("user");

    const bucketId = await getBucketIdByCourseId({
      courseId,
    });

    const hasPermissions = await isBucketMaintainer({
      userId: user.id,
      bucketId,
    });

    if (!hasPermissions) {
      throw new HTTPException(403, { message: "FORBIDDEN" });
    }

    const files = await getCourseFiles({
      courseId,
    });

    if (files.length === 0) {
      const deletedCourse = await deleteCourse({
        courseId,
      });

      return c.json({ name: deletedCourse });
    }

    const storageClient = getStorageClient();

    for (const file of files) {
      await db.delete(pages).where(eq(pages.fileId, file.id)); // Delete page records from the database
      await deleteFile({
        bucketId,
        fileId: file.id,
      });

      await storageClient.deleteFile({
        bucket: "files-bucket",
        key: `${courseId}/${file.name}`,
      });
    }

    const deletedCourse = await deleteCourse({
      courseId,
    });

    return c.json({ name: deletedCourse });
  }
);

export default app;
