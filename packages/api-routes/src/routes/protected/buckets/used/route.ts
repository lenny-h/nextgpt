import { db } from "@workspace/server/drizzle/db.js";
import { buckets, bucketUsers } from "@workspace/server/drizzle/schema.js";
import { eq } from "drizzle-orm";
import { Hono } from "hono";

const app = new Hono().get("/", async (c) => {
  const user = c.get("user");

  const usedBuckets = await db
    .select({
      bucketId: bucketUsers.bucketId,
      name: buckets.name,
      type: buckets.type,
    })
    .from(bucketUsers)
    .innerJoin(buckets, eq(bucketUsers.bucketId, buckets.id))
    .where(eq(bucketUsers.userId, user.id));

  return c.json({ items: usedBuckets });
});

export default app;
