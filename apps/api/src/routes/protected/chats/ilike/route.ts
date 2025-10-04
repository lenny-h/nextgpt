import { prefixSchema } from "@/src/schemas/prefix-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { chats } from "@workspace/server/drizzle/schema.js";
import { and, eq, ilike } from "drizzle-orm";
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
      .select()
      .from(chats)
      .where(and(eq(chats.userId, user.id), ilike(chats.title, `%${prefix}%`)))
      .limit(5);

    return c.json({ chats: result });
  }
);

export default app;
