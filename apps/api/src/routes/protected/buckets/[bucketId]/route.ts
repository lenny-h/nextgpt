import { deleteBucket, isBucketOwner } from "@/src/lib/db/queries/buckets.js";
import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import * as z from "zod";

const paramSchema = z.object({ bucketId: uuidSchema }).strict();

const app = new Hono().delete(
  "/",
  validator("param", (value) => {
    return paramSchema.parse(value);
  }),
  async (c) => {
    const { bucketId } = c.req.valid("param");
    const user = c.get("user");

    const hasPermissions = await isBucketOwner({
      userId: user.id,
      bucketId,
    });

    if (!hasPermissions) {
      throw new HTTPException(403, { message: "FORBIDDEN" });
    }

    const deletedBucket = await deleteBucket({ bucketId });

    return c.json({ name: deletedBucket.name });
  }
);

export default app;
