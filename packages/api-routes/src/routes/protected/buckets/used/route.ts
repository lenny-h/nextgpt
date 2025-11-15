import { db } from "@workspace/server/drizzle/db.js";
import { buckets, bucketUserRoles } from "@workspace/server/drizzle/schema.js";
import { eq } from "drizzle-orm";
import { Hono } from "hono";

const app = new Hono().get("/", async (c) => {
  const user = c.get("user");

  const [userBuckets, publicBuckets] = await Promise.all([
    db
      .select({
        bucketId: bucketUserRoles.bucketId,
        name: buckets.name,
        type: buckets.type,
      })
      .from(bucketUserRoles)
      .innerJoin(buckets, eq(bucketUserRoles.bucketId, buckets.id))
      .where(eq(bucketUserRoles.userId, user.id)),
    db
      .select({
        bucketId: buckets.id,
        name: buckets.name,
        type: buckets.type,
      })
      .from(buckets)
      .where(eq(buckets.public, true)),
  ]);

  // Deduplicate by bucketId
  const bucketMap = new Map<string, (typeof userBuckets)[0]>();
  userBuckets.forEach((bucket) => bucketMap.set(bucket.bucketId, bucket));
  publicBuckets.forEach((bucket) => bucketMap.set(bucket.bucketId, bucket));

  return c.json(Array.from(bucketMap.values()));
});

export default app;
