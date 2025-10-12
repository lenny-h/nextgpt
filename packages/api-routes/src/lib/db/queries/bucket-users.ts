import { db } from "@workspace/server/drizzle/db.js";
import { bucketUserRoles } from "@workspace/server/drizzle/schema.js";
import { and, eq, inArray } from "drizzle-orm";

export async function filterNonExistingBucketUsers({
  bucketId,
  userIds,
}: {
  bucketId: string;
  userIds: string[];
}) {
  // Get users that are already in the bucket
  const existingUsers = await db
    .select({ userId: bucketUserRoles.userId })
    .from(bucketUserRoles)
    .where(
      and(
        eq(bucketUserRoles.bucketId, bucketId),
        inArray(bucketUserRoles.userId, userIds)
      )
    );

  const existingUserIds = existingUsers.map((row) => row.userId);

  // Return only users that are not in the bucket
  return userIds.filter((userId) => !existingUserIds.includes(userId));
}
