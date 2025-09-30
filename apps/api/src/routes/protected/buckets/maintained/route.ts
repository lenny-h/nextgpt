import { db } from "@workspace/server/drizzle/db.js";
import {
  bucketMaintainers,
  buckets,
} from "@workspace/server/drizzle/schema.js";
import { eq } from "drizzle-orm";
import { type Context } from "hono";

// Get buckets the user maintains
export async function GET(c: Context) {
  const user = c.get("user");

  const maintainedBuckets = await db
    .select({
      id: buckets.id,
      owner: buckets.owner,
      name: buckets.name,
      size: buckets.size,
      maxSize: buckets.maxSize,
      type: buckets.type,
      usersCount: buckets.usersCount,
      subscriptionId: buckets.subscriptionId,
      createdAt: buckets.createdAt,
    })
    .from(bucketMaintainers)
    .innerJoin(buckets, eq(bucketMaintainers.bucketId, buckets.id))
    .where(eq(bucketMaintainers.userId, user.id));

  return c.json(maintainedBuckets);
}
