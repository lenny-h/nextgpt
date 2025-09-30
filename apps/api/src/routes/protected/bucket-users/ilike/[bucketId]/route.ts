import { isBucketMaintainer } from "@/src/lib/db/queries/bucket-maintainers.js";
import { prefixSchema } from "@/src/schemas/prefix-schema.js";
import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import {
  bucketUsers,
  user as profile,
} from "@workspace/server/drizzle/schema.js";
import { and, eq, ilike } from "drizzle-orm";
import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";

export async function GET(c: Context) {
  const bucketId = uuidSchema.parse(c.req.param("bucketId"));

  const prefix = prefixSchema.parse(c.req.query("prefix"));

  const user = c.get("user");

  const hasPermissions = await isBucketMaintainer({
    bucketId,
    userId: user.id,
  });

  if (!hasPermissions) {
    throw new HTTPException(403, { message: "FORBIDDEN" });
  }

  const users = await db
    .select({
      userId: bucketUsers.userId,
      username: profile.username,
    })
    .from(bucketUsers)
    .innerJoin(profile, eq(bucketUsers.userId, profile.id))
    .where(
      and(
        eq(bucketUsers.bucketId, bucketId),
        ilike(profile.username, `%${prefix}%`)
      )
    )
    .limit(5);

  return c.json(users);
}
