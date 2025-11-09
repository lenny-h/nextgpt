import * as z from "zod";

import { isBucketUser } from "@workspace/api-routes/lib/db/queries/buckets.js";
import { itemsPerPageSchema } from "@workspace/api-routes/schemas/items-per-page-schema.js";
import { pageNumberSchema } from "@workspace/api-routes/schemas/page-number-schema.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { courses } from "@workspace/server/drizzle/schema.js";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const paramSchema = z.object({ bucketId: uuidSchema }).strict();
const querySchema = z
  .object({
    pageNumber: pageNumberSchema,
    itemsPerPage: itemsPerPageSchema,
  })
  .strict();

const app = new Hono().get(
  "/",
  validator("param", (value, c) => {
    const parsed = paramSchema.safeParse(value);
    if (!parsed.success) {
      return c.text("BAD_REQUEST", 400);
    }
    return parsed.data;
  }),
  validator("query", (value, c) => {
    const parsed = querySchema.safeParse(value);
    if (!parsed.success) {
      return c.text("BAD_REQUEST", 400);
    }
    return parsed.data;
  }),
  async (c) => {
    const { bucketId } = c.req.valid("param");
    const { pageNumber, itemsPerPage } = c.req.valid("query");
    const user = c.get("user");

    const hasPermissions = isBucketUser({ bucketId, userId: user.id });

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
      .where(eq(courses.bucketId, bucketId))
      .limit(itemsPerPage)
      .offset(pageNumber * itemsPerPage);

    return c.json(result);
  }
);

export default app;
