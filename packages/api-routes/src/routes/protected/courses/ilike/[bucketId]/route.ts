import * as z from "zod";

import { isBucketUser } from "@workspace/api-routes/lib/db/queries/buckets.js";
import { prefixSchema } from "@workspace/api-routes/schemas/prefix-schema.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { courses } from "@workspace/server/drizzle/schema.js";
import { and, eq, ilike, sql } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const paramSchema = z.object({ bucketId: uuidSchema }).strict();
const querySchema = z.object({ prefix: prefixSchema }).strict();

const app = new Hono().get(
  "/",
  validator("param", (value, c) => {
    const parsed = paramSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }
    return parsed.data;
  }),
  validator("query", (value, c) => {
    const parsed = querySchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }
    return parsed.data;
  }),
  async (c) => {
    const { bucketId } = c.req.valid("param");
    const { prefix } = c.req.valid("query");
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
        and(
          eq(courses.bucketId, bucketId),
          ilike(courses.name, sql`${prefix} || '%'`)
        )
      )
      .limit(5);

    return c.json(result);
  }
);

export default app;
