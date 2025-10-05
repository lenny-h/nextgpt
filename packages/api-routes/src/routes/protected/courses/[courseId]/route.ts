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
import { getFilePages } from "@workspace/api-routes/lib/db/queries/pages.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { getPagesBucket } from "@workspace/api-routes/utils/access-clients/google-storage-client.js";
import { deleteFileFromS3 } from "@workspace/api-routes/utils/access-clients/s3-client.js";
import { db } from "@workspace/server/drizzle/db.js";
import { pages } from "@workspace/server/drizzle/schema.js";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const paramSchema = z.object({ courseId: uuidSchema }).strict();

const app = new Hono().delete(
  "/",
  validator("param", (value) => {
    return paramSchema.parse(value);
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

    const pagesBucket = getPagesBucket();

    for (const file of files) {
      const filePages = await getFilePages({
        fileId: file.id,
      });

      for (const filePage of filePages) {
        const pageName = filePage.id + ".pdf";
        await pagesBucket.file(pageName).delete(); // Delete from GCS
        await db.delete(pages).where(eq(pages.id, filePage.id)); // Delete from postgres
      }

      await deleteFileFromS3({
        bucket: `${process.env.GOOGLE_VERTEX_PROJECT}-files-bucket`,
        key: `${courseId}/${file.name}`,
      });
      await deleteFile({
        bucketId,
        fileId: file.id,
      });
    }

    const deletedCourse = await deleteCourse({
      courseId,
    });

    return c.json({ name: deletedCourse });
  }
);

export default app;
