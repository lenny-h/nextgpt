import { db } from "@workspace/server/drizzle/db.js";
import { courseUsers } from "@workspace/server/drizzle/schema.js";
import { and, eq } from "drizzle-orm";

export async function addUserToCourse({
  courseId,
  userId,
}: {
  courseId: string;
  userId: string;
}) {
  await db
    .insert(courseUsers)
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
    .from(courseUsers)
    .where(
      and(eq(courseUsers.courseId, courseId), eq(courseUsers.userId, userId))
    )
    .limit(1);

  return result.length > 0;
}
