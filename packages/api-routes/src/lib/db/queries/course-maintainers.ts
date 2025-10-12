import { db } from "@workspace/server/drizzle/db.js";
import { courseUserRoles } from "@workspace/server/drizzle/schema.js";
import { and, eq, inArray } from "drizzle-orm";

export async function isCourseMaintainer({
  userId,
  courseId,
}: {
  userId: string;
  courseId: string;
}) {
  const result = await db
    .select()
    .from(courseUserRoles)
    .where(
      and(
        eq(courseUserRoles.userId, userId),
        eq(courseUserRoles.courseId, courseId)
      )
    )
    .limit(1);

  return result.length > 0 && result[0].role === "maintainer";
}

export async function removeCourseMaintainer({
  userId,
  courseId,
}: {
  userId: string;
  courseId: string;
}) {
  await db
    .delete(courseUserRoles)
    .where(
      and(
        eq(courseUserRoles.userId, userId),
        eq(courseUserRoles.courseId, courseId),
        eq(courseUserRoles.role, "maintainer")
      )
    );
}

export async function removeCourseMaintainersBatch({
  userIds,
  courseId,
}: {
  userIds: string[];
  courseId: string;
}) {
  await db
    .delete(courseUserRoles)
    .where(
      and(
        eq(courseUserRoles.courseId, courseId),
        inArray(courseUserRoles.userId, userIds),
        eq(courseUserRoles.role, "maintainer")
      )
    );
}

export async function filterNonExistingCourseMaintainers({
  courseId,
  userIds,
}: {
  courseId: string;
  userIds: string[];
}) {
  const existingMaintainers = await db
    .select({ userId: courseUserRoles.userId })
    .from(courseUserRoles)
    .where(
      and(
        eq(courseUserRoles.courseId, courseId),
        inArray(courseUserRoles.userId, userIds),
        eq(courseUserRoles.role, "maintainer")
      )
    );

  const existingMaintainerIds = existingMaintainers.map((row) => row.userId);
  return userIds.filter((userId) => !existingMaintainerIds.includes(userId));
}
