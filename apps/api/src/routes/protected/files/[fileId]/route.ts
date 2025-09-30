import { isCourseMaintainer } from "@/src/lib/db/queries/course-maintainers.js";
import { getBucketIdByCourseId } from "@/src/lib/db/queries/courses.js";
import { deleteFile, getFileDetails } from "@/src/lib/db/queries/files.js";
import { getFilePages } from "@/src/lib/db/queries/pages.js";
import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { getPagesBucket } from "@/src/utils/access-clients/google-storage-client.js";
import { deleteFileFromS3 } from "@/src/utils/access-clients/s3-client.js";
import { db } from "@workspace/server/drizzle/db.js";
import { pages } from "@workspace/server/drizzle/schema.js";
import { eq } from "drizzle-orm";
import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";

export async function DELETE(c: Context) {
  const fileId = uuidSchema.parse(c.req.param("fileId"));

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
