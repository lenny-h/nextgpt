import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import {
  deleteBucket,
  isBucketOwner,
} from "../../../../lib/db/queries/buckets.js";
import { uuidSchema } from "../../../../schemas/uuid-schema.js";

export async function DELETE(c: Context) {
  const bucketId = uuidSchema.parse(c.req.param("bucketId"));

  const user = c.get("user");

  const isOwner = await isBucketOwner({
    userId: user.id,
    bucketId,
  });

  if (!isOwner) {
    throw new HTTPException(403, { message: "Forbidden" });
  }

  const deletedBucket = await deleteBucket({ bucketId });

  return c.json({ name: deletedBucket.name });
}
