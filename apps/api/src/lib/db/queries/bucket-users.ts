import { db } from "@/drizzle/db.js";
import { bucketUsers } from "@/drizzle/schema.js";
import { and, eq, inArray } from "drizzle-orm";

export async function filterNonExistingBucketUsers({
  bucketId,
  userIds,
}: {
  bucketId: string;
  userIds: string[];
}) {
  // Get users that ARE already in the bucket
  const existingUsers = await db
    .select({ userId: bucketUsers.userId })
    .from(bucketUsers)
    .where(
      and(
        eq(bucketUsers.bucketId, bucketId),
        inArray(bucketUsers.userId, userIds)
      )
    );

  const existingUserIds = existingUsers.map((row) => row.userId);

  // Return only users that are NOT in the bucket
  return userIds.filter((userId) => !existingUserIds.includes(userId));
}
