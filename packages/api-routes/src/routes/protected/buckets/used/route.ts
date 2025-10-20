import { db } from "@workspace/server/drizzle/db.js";
import { buckets, bucketUserRoles } from "@workspace/server/drizzle/schema.js";
import { eq } from "drizzle-orm";
import { Hono } from "hono";

const app = new Hono().get("/", async (c) => {
  const user = c.get("user");

  const usedBuckets = await db
    .select({
      bucketId: bucketUserRoles.bucketId,
      name: buckets.name,
      type: buckets.type,
    })
    .from(bucketUserRoles)
    .innerJoin(buckets, eq(bucketUserRoles.bucketId, buckets.id))
    .where(eq(bucketUserRoles.userId, user.id));

  return c.json(usedBuckets);
});

export default app;
