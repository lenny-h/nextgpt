import { db } from "@workspace/server/drizzle/db.js";
import { courseUserRoles } from "@workspace/server/drizzle/schema.js";
import { and, eq } from "drizzle-orm";

export async function addUserToCourse({
  courseId,
  userId,
}: {
  courseId: string;
  userId: string;
}) {
  await db
    .insert(courseUserRoles)
    .values({
      courseId,
      userId,
    })
    .onConflictDoNothing();
}

export async function checkUserCourseAccess({
  courseId,
  userId,
}: {
  courseId: string;
  userId: string;
}) {
  const result = await db
    .select()
    .from(courseUserRoles)
    .where(
      and(
        eq(courseUserRoles.courseId, courseId),
        eq(courseUserRoles.userId, userId)
      )
    )
    .limit(1);

  return result.length > 0;
}
