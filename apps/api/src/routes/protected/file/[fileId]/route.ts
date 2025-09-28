import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { isCourseMaintainer } from "../../../../lib/db/queries/course-maintainers.js";
import { getBucketIdByCourseId } from "../../../../lib/db/queries/courses.js";
import {
  deleteFile,
  getFileDetails,
} from "../../../../lib/db/queries/files.js";
import { deletePage, getFilePages } from "../../../../lib/db/queries/pages.js";
import { uuidSchema } from "../../../../schemas/uuid-schema.js";
import { getPagesBucket } from "../../../../utils/access-clients/google-storage-client.js";
import { deleteFileFromS3 } from "../../../../utils/access-clients/s3-client.js";

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
    throw new HTTPException(403, { message: "Forbidden" });
  }

  const pagesBucket = getPagesBucket();

  const filePages = await getFilePages({
    fileId,
  });

  for (const filePage of filePages) {
    const pageName = filePage.id + ".pdf";
    await pagesBucket.file(pageName).delete();
    await deletePage({
      pageId: filePage.id,
    });
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
