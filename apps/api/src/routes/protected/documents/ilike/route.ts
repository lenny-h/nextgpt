import { prefixSchema } from "@/src/schemas/prefix-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { documents } from "@workspace/server/drizzle/schema.js";
import { and, eq, ilike, sql } from "drizzle-orm";
import { type Context } from "hono";

export async function GET(c: Context) {
  const prefix = prefixSchema.parse(c.req.query("prefix"));

  const user = c.get("user");

  const result = await db
    .select({
      id: documents.id,
      title: documents.title,
      content: sql`SUBSTRING(${documents.content}, 1, 50)`.as("content"),
      kind: documents.kind,
      createdAt: documents.createdAt,
    })
    .from(documents)
    .where(
      and(eq(documents.userId, user.id), ilike(documents.title, `%${prefix}%`))
    )
    .limit(5);

  return c.json({ documents: result });
}
