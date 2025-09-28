import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { isBucketOwner } from "../../../../lib/db/queries/buckets.js";
import {
  deleteModel,
  getModelDetails,
} from "../../../../lib/db/queries/models.js";
import { uuidSchema } from "../../../../schemas/uuid-schema.js";

export async function DELETE(c: Context) {
  const modelId = uuidSchema.parse(c.req.param("modelId"));

  const user = c.get("user");

  const { bucketId, name } = await getModelDetails({
    modelId,
  });

  const isOwner = await isBucketOwner({
    userId: user.id,
    bucketId,
  });

  if (!isOwner) {
    throw new HTTPException(403, { message: "Forbidden" });
  }

  await deleteModel({
    modelId,
  });

  return Response.json({ name });
}
