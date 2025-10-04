import { prefixSchema } from "@/src/schemas/prefix-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { documents } from "@workspace/server/drizzle/schema.js";
import { and, eq, ilike, sql } from "drizzle-orm";
import { Hono } from "hono";
import { validator } from "hono/validator";
import * as z from "zod";

const querySchema = z.object({ prefix: prefixSchema }).strict();

const app = new Hono().get(
  "/",
  validator("query", (value) => {
    return querySchema.parse(value);
  }),
  async (c) => {
    const { prefix } = c.req.valid("query");
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
        and(
          eq(documents.userId, user.id),
          ilike(documents.title, `%${prefix}%`)
        )
      )
      .limit(5);

    return c.json({ documents: result });
  }
);

export default app;
