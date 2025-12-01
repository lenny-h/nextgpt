import * as z from "zod";

import { prefixSchema } from "@workspace/api-routes/schemas/prefix-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { documents } from "@workspace/server/drizzle/schema.js";
import { and, eq, ilike, sql } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const querySchema = z.object({ prefix: prefixSchema }).strict();

const app = new Hono().get(
  "/",
  validator("query", (value, c) => {
    const parsed = querySchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }
    return parsed.data;
  }),
  async (c) => {
    const { prefix } = c.req.valid("query");
    const user = c.get("user");

    const result = await db
      .select({
        id: documents.id,
        title: documents.title,
        content: sql<string>`SUBSTRING(${documents.content}, 1, 50)`.as(
          "content"
        ),
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

    return c.json(result);
  }
);

export default app;
