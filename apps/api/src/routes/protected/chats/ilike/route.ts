import { prefixSchema } from "@/src/schemas/prefix-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { chats } from "@workspace/server/drizzle/schema.js";
import { and, eq, ilike } from "drizzle-orm";
import { type Context } from "hono";

export async function GET(c: Context) {
  const prefix = prefixSchema.parse(c.req.query("prefix"));

  const user = c.get("user");

  const result = await db
    .select()
    .from(chats)
    .where(and(eq(chats.userId, user.id), ilike(chats.title, `%${prefix}%`)))
    .limit(5);

  return c.json(result);
}
