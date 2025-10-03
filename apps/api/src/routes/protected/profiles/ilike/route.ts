import { prefixSchema } from "@/src/schemas/prefix-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { user as profile } from "@workspace/server/drizzle/schema.js";
import { and, eq, ilike } from "drizzle-orm";
import { type Context } from "hono";

// Ilike public profiles
export async function GET(c: Context) {
  const prefix = prefixSchema.parse(c.req.query("prefix"));

  const user = c.get("user");

  const result = await db
    .select({
      id: profile.id,
      username: profile.username,
    })
    .from(profile)
    .where(and(eq(user.isPublic, true), ilike(profile.username, `%${prefix}%`)))
    .limit(5);

  return c.json({ profiles: result });
}
