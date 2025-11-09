import * as z from "zod";

import { prefixSchema } from "@workspace/api-routes/schemas/prefix-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { user as profile } from "@workspace/server/drizzle/schema.js";
import { and, eq, ilike } from "drizzle-orm";
import { Hono } from "hono";
import { validator } from "hono/validator";

const querySchema = z.object({ prefix: prefixSchema }).strict();

const app = new Hono().get(
  "/",
  validator("query", (value, c) => {
    const parsed = querySchema.safeParse(value);
    if (!parsed.success) {
      return c.text("BAD_REQUEST", 400);
    }
    return parsed.data;
  }),
  async (c) => {
    const { prefix } = c.req.valid("query");

    const result = await db
      .select({
        id: profile.id,
        username: profile.username,
      })
      .from(profile)
      .where(
        and(eq(profile.isPublic, true), ilike(profile.username, `%${prefix}%`))
      )
      .limit(5);

    return c.json(result);
  }
);

export default app;
