import * as z from "zod";

import { isCourseMaintainer } from "@workspace/api-routes/lib/db/queries/course-maintainers.js";
import { getBucketIdByCourseId } from "@workspace/api-routes/lib/db/queries/courses.js";
import {
  deleteFile,
  getFileDetails,
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

const paramSchema = z.object({ fileId: uuidSchema }).strict();

const app = new Hono().delete(
  "/",
  validator("param", (value) => {
    return paramSchema.parse(value);
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

    const pagesBucket = getPagesBucket();

    const filePages = await getFilePages({
      fileId,
    });

    for (const filePage of filePages) {
      const pageName = filePage.id + ".pdf";
      await pagesBucket.file(pageName).delete();
      await db.delete(pages).where(eq(pages.id, filePage.id));
    }

    await deleteFileFromS3({
      bucket: `${process.env.GOOGLE_VERTEX_PROJECT}-files-bucket`,
      key: `${courseId}/${name}`,
    });
    await deleteFile({
      bucketId,
      fileId,
    });

    return c.json({ name });
  }
);

export default app;
