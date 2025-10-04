import { isBucketUser } from "@/src/lib/db/queries/buckets.js";
import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { models } from "@workspace/server/drizzle/schema.js";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import * as z from "zod";

const paramSchema = z.object({ bucketId: uuidSchema }).strict();

const app = new Hono().get(
  "/",
  validator("param", (value) => {
    return paramSchema.parse(value);
  }),
  async (c) => {
    const { bucketId } = c.req.valid("param");
    const user = c.get("user");

    const hasPermissions = isBucketUser({
      userId: user.id,
      bucketId,
    });

    if (!hasPermissions) {
      throw new HTTPException(403, { message: "FORBIDDEN" });
    }

    const result = await db
      .select({
        id: models.id,
        name: models.name,
        description: models.description,
      })
      .from(models)
      .where(eq(models.bucketId, bucketId));

    return c.json({ models: result });
  }
);

export default app;
