import { decryptApiKey } from "@/src/utils/encryption.js";
import { db } from "@workspace/server/drizzle/db.js";
import { courseKeys } from "@workspace/server/drizzle/schema.js";
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

export async function validateCourseKey({
  courseId,
  key,
}: {
  courseId: string;
  key: string;
}) {
  const result = await db
    .select({ key: courseKeys.key })
    .from(courseKeys)
    .where(eq(courseKeys.courseId, courseId))
    .limit(1);

  if (result.length === 0) {
    throw new HTTPException(400, {
      message: "COURSE_NOT_FOUND",
    });
  }

  if (key !== decryptApiKey(result[0].key)) {
    throw new HTTPException(403, { message: "INVALID_COURSE_KEY" });
  }

  return true;
}
