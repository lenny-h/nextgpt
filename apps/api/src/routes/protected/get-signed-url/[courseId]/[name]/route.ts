import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getBucketIdByCourseId } from "../../../../../lib/db/queries/courses.js";
import { filenameSchema } from "../../../../../schemas/filename-schema.js";
import { uuidSchema } from "../../../../../schemas/uuid-schema.js";
import { getSignedUrlForDownload } from "../../../../../utils/access-clients/s3-client.js";
import { userHasPermissions } from "../../../../../utils/user-has-permissions.js";

export async function GET(c: Context) {
  // Get user from auth middleware context
  const user = c.get("user");

  if (!user) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const courseId = c.req.param("courseId");
  const filename = decodeURIComponent(c.req.param("name"));

  if (
    !uuidSchema.safeParse(courseId).success ||
    !filenameSchema.safeParse(filename).success
  ) {
    throw new HTTPException(400, { message: "Bad request" });
  }

  const bucketId = await getBucketIdByCourseId({ courseId });

  const hasPermission = await userHasPermissions({
    userId: user.id,
    metadata: user.app_metadata,
    bucketId,
    courses: [courseId],
    files: [],
  });

  if (!hasPermission) {
    throw new HTTPException(403, { message: "Forbidden" });
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
