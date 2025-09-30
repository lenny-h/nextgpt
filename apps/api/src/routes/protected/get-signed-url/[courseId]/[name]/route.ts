import { getBucketIdByCourseId } from "@/src/lib/db/queries/courses.js";
import { filenameSchema } from "@/src/schemas/filename-schema.js";
import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { getSignedUrlForDownload } from "@/src/utils/access-clients/s3-client.js";
import { userHasPermissions } from "@/src/utils/user-has-permissions.js";
import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";

export async function GET(c: Context) {
  const user = c.get("user");

  const courseId = uuidSchema.parse(c.req.param("courseId"));
  const filename = filenameSchema.parse(
    decodeURIComponent(c.req.param("name"))
  );

  const bucketId = await getBucketIdByCourseId({ courseId });

  const hasPermission = await userHasPermissions({
    userId: user.id,
    metadata: user.app_metadata,
    bucketId,
    courses: [courseId],
    files: [],
  });

  if (!hasPermission) {
    throw new HTTPException(403, { message: "FORBIDDEN" });
  }

  const filePath = `${courseId}/${filename}`;

  const signedUrl = await getSignedUrlForDownload({
    bucket: `${process.env.GOOGLE_VERTEX_PROJECT}-files-bucket`,
    key: filePath,
  });

  return c.json({
    signedUrl,
  });
}
