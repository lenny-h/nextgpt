import { db } from "@/drizzle/db.js";
import { bucketMaintainers } from "@/drizzle/schema.js";
import { and, count, eq, inArray } from "drizzle-orm";

export async function isBucketMaintainer({
  userId,
  bucketId,
}: {
  userId: string;
  bucketId: string;
}) {
  const result = await db
    .select({ count: count() })
    .from(bucketMaintainers)
    .where(
      and(
        eq(bucketMaintainers.userId, userId),
        eq(bucketMaintainers.bucketId, bucketId)
      )
    );

  return result[0].count > 0;
}

export async function removeBucketMaintainer({
  userId,
  bucketId,
}: {
  userId: string;
  bucketId: string;
}) {
  await db
    .delete(bucketMaintainers)
    .where(
      and(
        eq(bucketMaintainers.userId, userId),
        eq(bucketMaintainers.bucketId, bucketId)
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
    .delete(bucketMaintainers)
    .where(
      and(
        eq(bucketMaintainers.bucketId, bucketId),
        inArray(bucketMaintainers.userId, userIds)
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
  // Get users that ARE already maintainers of the bucket
  const existingMaintainers = await db
    .select({ userId: bucketMaintainers.userId })
    .from(bucketMaintainers)
    .where(
      and(
        eq(bucketMaintainers.bucketId, bucketId),
        inArray(bucketMaintainers.userId, userIds)
      )
    );

  const existingMaintainerIds = existingMaintainers.map((row) => row.userId);

  // Return only users that are NOT maintainers of the bucket
  return userIds.filter((userId) => !existingMaintainerIds.includes(userId));
}
