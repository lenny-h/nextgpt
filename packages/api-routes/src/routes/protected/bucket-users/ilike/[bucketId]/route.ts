import * as z from "zod";

import { isBucketMaintainer } from "@workspace/api-routes/lib/db/queries/bucket-maintainers.js";
import { prefixSchema } from "@workspace/api-routes/schemas/prefix-schema.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import {
  bucketUserRoles,
  user as profile,
} from "@workspace/server/drizzle/schema.js";
import { and, eq, ilike } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const paramSchema = z.object({ bucketId: uuidSchema }).strict();
const querySchema = z.object({ prefix: prefixSchema }).strict();

const app = new Hono().get(
  "/",
  validator("param", (value) => {
    return paramSchema.parse(value);
  }),
  validator("query", (value) => {
    return querySchema.parse(value);
  }),
  async (c) => {
    const { bucketId } = c.req.valid("param");
    const { prefix } = c.req.valid("query");
    const user = c.get("user");

    const hasPermissions = await isBucketMaintainer({
      bucketId,
      userId: user.id,
    });

    if (!hasPermissions) {
      throw new HTTPException(403, { message: "FORBIDDEN" });
    }

    const users = await db
      .select({
        id: bucketUserRoles.userId,
        username: profile.username,
      })
      .from(bucketUserRoles)
      .innerJoin(profile, eq(bucketUserRoles.userId, profile.id))
      .where(
        and(
          eq(bucketUserRoles.bucketId, bucketId),
          ilike(profile.username, `%${prefix}%`)
        )
      )
      .limit(5);

    return c.json(users);
  }
);

export default app;
