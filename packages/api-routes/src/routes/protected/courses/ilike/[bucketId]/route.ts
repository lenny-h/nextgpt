import { isBucketUser } from "@workspace/api-routes/lib/db/queries/buckets.js";
import { prefixSchema } from "@workspace/api-routes/schemas/prefix-schema.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { buckets, courses } from "@workspace/server/drizzle/schema.js";
import { and, eq, ilike, sql } from "drizzle-orm";
import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";

export async function GET(c: Context) {
  const bucketId = uuidSchema.parse(c.req.param("chatId"));
  const prefix = prefixSchema.parse(c.req.query("prefix"));

  const user = c.get("user");

  const hasPermissions = await isBucketUser({ userId: user.id, bucketId });

  if (!hasPermissions) {
    throw new HTTPException(403, { message: "FORBIDDEN" });
  }

  const result = await db
    .select({
      id: courses.id,
      name: courses.name,
      private: courses.private,
    })
    .from(courses)
    .where(
      and(eq(buckets.id, bucketId), ilike(courses.name, sql`${prefix} || '%'`))
    )
    .limit(5);

  return c.json({ courses: result });
}
