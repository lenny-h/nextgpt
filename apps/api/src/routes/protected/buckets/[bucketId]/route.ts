import { deleteBucket, isBucketOwner } from "@/src/lib/db/queries/buckets.js";
import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";

export async function DELETE(c: Context) {
  const bucketId = uuidSchema.parse(c.req.param("bucketId"));

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
