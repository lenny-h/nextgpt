import * as z from "zod";

import { isBucketMaintainer } from "@workspace/api-routes/lib/db/queries/bucket-maintainers.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { bucketUserRoles } from "@workspace/server/drizzle/schema.js";
import { count, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const paramSchema = z.object({ bucketId: uuidSchema }).strict();

const app = new Hono().get(
  "/",
  validator("param", (value) => {
    return paramSchema.parse(value);
  }),
  async (c) => {
    const { bucketId } = c.req.valid("param");
    const user = c.get("user");

    const hasPermissions = await isBucketMaintainer({
      userId: user.id,
      bucketId,
    });

    if (!hasPermissions) {
      throw new HTTPException(403, { message: "FORBIDDEN" });
    }

    // Get user count for the bucket
    const result = await db
      .select({ count: count() })
      .from(bucketUserRoles)
      .where(eq(bucketUserRoles.bucketId, bucketId));

    return c.json({ userCount: result[0].count });
  }
);

export default app;
