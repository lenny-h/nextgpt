import { and, eq, inArray } from "drizzle-orm";
import { db } from "@workspace/server/drizzle/db.js";
import { courseMaintainers } from "@workspace/server/drizzle/schema.js";

export async function isCourseMaintainer({
  userId,
  courseId,
}: {
  userId: string;
  courseId: string;
}) {
  const result = await db
    .select()
    .from(courseMaintainers)
    .where(
      and(
        eq(courseMaintainers.userId, userId),
        eq(courseMaintainers.courseId, courseId)
      )
    )
    .limit(1);

  return result.length > 0;
}

export async function removeCourseMaintainer({
  userId,
  courseId,
}: {
  userId: string;
  courseId: string;
}) {
  await db
    .delete(courseMaintainers)
    .where(
      and(
        eq(courseMaintainers.userId, userId),
        eq(courseMaintainers.courseId, courseId)
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
    .delete(courseMaintainers)
    .where(
      and(
        eq(courseMaintainers.courseId, courseId),
        inArray(courseMaintainers.userId, userIds)
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
    .select({ userId: courseMaintainers.userId })
    .from(courseMaintainers)
    .where(
      and(
        eq(courseMaintainers.courseId, courseId),
        inArray(courseMaintainers.userId, userIds)
      )
    );

  const existingMaintainerIds = existingMaintainers.map((row) => row.userId);
  return userIds.filter((userId) => !existingMaintainerIds.includes(userId));
}
