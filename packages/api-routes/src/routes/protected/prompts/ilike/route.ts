import * as z from "zod";

import { prefixSchema } from "@workspace/api-routes/schemas/prefix-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { prompts } from "@workspace/server/drizzle/schema.js";
import { and, eq, ilike } from "drizzle-orm";
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
        id: prompts.id,
        name: prompts.name,
        content: prompts.content,
      })
      .from(prompts)
      .where(
        and(eq(prompts.userId, user.id), ilike(prompts.name, `%${prefix}%`))
      )
      .limit(5);

    return c.json(result);
  }
);

export default app;
