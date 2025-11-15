import { db } from "@workspace/server/drizzle/db.js";
import {
  buckets,
  type BucketType,
  bucketUserRoles,
} from "@workspace/server/drizzle/schema.js";
import { and, eq, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

const maxFileSizes = {
  small: 5,
  medium: 20,
  large: 100,
  org: 1000,
};

export async function getBuckets({ userId }: { userId: string }) {
  return await db.select().from(buckets).where(eq(buckets.owner, userId));
}

export async function getBucketOwner({ bucketId }: { bucketId: string }) {
  const result = await db
    .select({ owner: buckets.owner, name: buckets.name })
    .from(buckets)
    .where(eq(buckets.id, bucketId))
    .limit(1);

  if (result.length === 0) {
    throw new HTTPException(404, { message: "NOT_FOUND" });
  }
  return result[0];
}

export async function getBucketName({ bucketId }: { bucketId: string }) {
  const result = await db
    .select({ name: buckets.name })
    .from(buckets)
    .where(eq(buckets.id, bucketId))
    .limit(1);

  if (result.length === 0) {
    throw new HTTPException(404, { message: "NOT_FOUND" });
  }
  return result[0].name;
}

export async function getUserBuckets({ userId }: { userId: string }) {
  return await db
    .select({ bucketId: bucketUserRoles.bucketId })
    .from(bucketUserRoles)
    .where(eq(bucketUserRoles.userId, userId));
}

export async function isBucketPublic({ bucketId }: { bucketId: string }) {
  const result = await db
    .select({ public: buckets.public })
    .from(buckets)
    .where(eq(buckets.id, bucketId))
    .limit(1);

  if (result.length === 0) {
    return false;
  }
  return result[0].public;
}

export async function isBucketUser({
  userId,
  bucketId,
}: {
  userId: string;
  bucketId: string;
}) {
  // Check if bucket is public first
  const isPublic = await isBucketPublic({ bucketId });
  if (isPublic) {
    return true;
  }

  // Otherwise check if user has explicit access
  const result = await db
    .select({ bucketId: bucketUserRoles.bucketId })
    .from(bucketUserRoles)
    .where(
      and(
        eq(bucketUserRoles.bucketId, bucketId),
        eq(bucketUserRoles.userId, userId)
      )
    )
    .limit(1);

  return result.length > 0;
}

export async function isBucketOwner({
  userId,
  bucketId,
}: {
  userId: string;
  bucketId: string;
}) {
  const result = await db
    .select({ owner: buckets.owner })
    .from(buckets)
    .where(eq(buckets.id, bucketId))
    .limit(1);

  if (result.length === 0) {
    return false;
  }
  return result[0].owner === userId;
}

export async function createBucket({
  userId,
  name,
  type,
  public: isPublic = false,
}: {
  userId: string;
  name: string;
  type: BucketType;
  public?: boolean;
}) {
  const maxSize = maxFileSizes[type] * 1024 * 1024 * 1024;

  return await db.transaction(async (tx) => {
    // Insert bucket
    const [bucket] = await tx
      .insert(buckets)
      .values({
        owner: userId,
        name,
        type,
        maxSize,
        public: isPublic,
      })
      .returning({ id: buckets.id });

    // Register user as maintainer
    await tx.insert(bucketUserRoles).values({
      bucketId: bucket.id,
      userId,
      role: "maintainer",
    });

    return bucket.id;
  });
}

export async function deleteBucket({ bucketId }: { bucketId: string }) {
  const result = await db
    .delete(buckets)
    .where(eq(buckets.id, bucketId))
    .returning({ name: buckets.name });

  if (result.length === 0) {
    throw new HTTPException(404, { message: "NOT_FOUND" });
  }
  return { name: result[0].name };
}

export async function getBucketSize({ bucketId }: { bucketId: string }) {
  const result = await db
    .select({ size: buckets.size, maxSize: buckets.maxSize })
    .from(buckets)
    .where(eq(buckets.id, bucketId))
    .limit(1);

  if (result.length === 0) {
    throw new HTTPException(404, { message: "NOT_FOUND" });
  }
  return {
    size: result[0].size,
    maxSize: result[0].maxSize,
  };
}

export async function increaseBucketSize({
  bucketId,
  fileSize,
}: {
  bucketId: string;
  fileSize: number;
}) {
  const result = await db
    .update(buckets)
    .set({
      size: sql`${buckets.size} + ${fileSize}`,
    })
    .where(eq(buckets.id, bucketId))
    .returning({ id: buckets.id });

  if (result.length === 0) {
    throw new HTTPException(404, { message: "NOT_FOUND" });
  }
  return result[0].id;
}
