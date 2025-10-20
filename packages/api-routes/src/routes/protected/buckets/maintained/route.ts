import { db } from "@workspace/server/drizzle/db.js";
import { buckets, bucketUserRoles } from "@workspace/server/drizzle/schema.js";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";

const app = new Hono().get("/", async (c) => {
  const user = c.get("user");

  const maintainedBuckets = await db
    .select({
      id: buckets.id,
      owner: buckets.owner,
      name: buckets.name,
      size: buckets.size,
      maxSize: buckets.maxSize,
      type: buckets.type,
      subscriptionId: buckets.subscriptionId,
      createdAt: buckets.createdAt,
    })
    .from(bucketUserRoles)
    .innerJoin(buckets, eq(bucketUserRoles.bucketId, buckets.id))
    .where(
      and(
        eq(bucketUserRoles.userId, user.id),
        eq(bucketUserRoles.role, "maintainer")
      )
    );

  return c.json(maintainedBuckets);
});

export default app;
