import { db } from "@workspace/server/drizzle/db.js";
import {
  bucketMaintainers,
  buckets,
  bucketUsers,
} from "@workspace/server/drizzle/schema.js";
import { and, eq, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

const maxFileSizes = {
  small: 2,
  medium: 5,
  large: 10,
  org: 50,
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
    .select({ bucketId: bucketUsers.bucketId })
    .from(bucketUsers)
    .where(eq(bucketUsers.userId, userId));
}

export async function isBucketUser({
  userId,
  bucketId,
}: {
  userId: string;
  bucketId: string;
}) {
  const result = await db
    .select({ bucketId: bucketUsers.bucketId })
    .from(bucketUsers)
    .where(
      and(eq(bucketUsers.bucketId, bucketId), eq(bucketUsers.userId, userId))
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
    throw new HTTPException(404, { message: "NOT_FOUND" });
  }
  return result[0].owner === userId;
}

export async function createBucket({
  userId,
  name,
  type,
}: {
  userId: string;
  name: string;
  type: "small" | "medium" | "large";
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
        usersCount: 1,
        maxSize,
      })
      .returning({ id: buckets.id });

    // Insert bucket maintainer
    await tx.insert(bucketMaintainers).values({
      bucketId: bucket.id,
      userId,
    });

    // Insert bucket user
    await tx.insert(bucketUsers).values({
      bucketId: bucket.id,
      userId,
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
