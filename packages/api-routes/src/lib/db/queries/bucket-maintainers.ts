import { db } from "@workspace/server/drizzle/db.js";
import { bucketUserRoles } from "@workspace/server/drizzle/schema.js";
import { and, eq, inArray } from "drizzle-orm";

export async function isBucketMaintainer({
  userId,
  bucketId,
}: {
  userId: string;
  bucketId: string;
}) {
  const result = await db
    .select()
    .from(bucketUserRoles)
    .where(
      and(
        eq(bucketUserRoles.userId, userId),
        eq(bucketUserRoles.bucketId, bucketId)
      )
    )
    .limit(1);

  return result.length > 0 && result[0].role === "maintainer";
}

export async function removeBucketMaintainer({
  userId,
  bucketId,
}: {
  userId: string;
  bucketId: string;
}) {
  await db
    .delete(bucketUserRoles)
    .where(
      and(
        eq(bucketUserRoles.userId, userId),
        eq(bucketUserRoles.bucketId, bucketId),
        eq(bucketUserRoles.role, "maintainer")
      )
    );
}

export async function removeBucketMaintainersBatch({
  userIds,
  bucketId,
}: {
  userIds: string[];
  bucketId: string;
}) {
  await db
    .delete(bucketUserRoles)
    .where(
      and(
        eq(bucketUserRoles.bucketId, bucketId),
        inArray(bucketUserRoles.userId, userIds),
        eq(bucketUserRoles.role, "maintainer")
      )
    );
}

export async function filterNonExistingBucketMaintainers({
  bucketId,
  userIds,
}: {
  bucketId: string;
  userIds: string[];
}) {
  // Get users that are already maintainers of the bucket
  const existingMaintainers = await db
    .select({ userId: bucketUserRoles.userId })
    .from(bucketUserRoles)
    .where(
      and(
        eq(bucketUserRoles.bucketId, bucketId),
        inArray(bucketUserRoles.userId, userIds),
        eq(bucketUserRoles.role, "maintainer")
      )
    );

  const existingMaintainerIds = existingMaintainers.map((row) => row.userId);

  // Return only users that are not maintainers of the bucket
  return userIds.filter((userId) => !existingMaintainerIds.includes(userId));
}
