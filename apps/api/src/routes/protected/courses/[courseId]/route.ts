import { type Context } from "hono";
import { isCourseMaintainer } from "../../../../lib/db/queries/course-maintainers.js";
import {
  deleteCourse,
  getBucketIdByCourseId,
} from "../../../../lib/db/queries/courses.js";
import {
  deleteFile,
  getCourseFiles,
} from "../../../../lib/db/queries/files.js";
import { deletePage, getFilePages } from "../../../../lib/db/queries/pages.js";
import { uuidSchema } from "../../../../schemas/uuid-schema.js";
import { getPagesBucket } from "../../../../utils/access-clients/google-storage-client.js";
import { deleteFileFromS3 } from "../../../../utils/access-clients/s3-client.js";

export async function DELETE(c: Context) {
  const courseId = uuidSchema.parse(c.req.param("courseId"));

  const user = c.get("user");

  const isMaintainer = await isCourseMaintainer({
    userId: user.id,
    courseId,
  });

  if (!isMaintainer) {
    return new Response("Forbidden", { status: 403 });
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

  const bucketId = await getBucketIdByCourseId({ courseId });

  const pagesBucket = getPagesBucket();

  for (const file of files) {
    const filePages = await getFilePages({
      fileId: file.id,
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
