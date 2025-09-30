import { isBucketMaintainer } from "@/src/lib/db/queries/bucket-maintainers.js";
import { deleteModel, getModelDetails } from "@/src/lib/db/queries/models.js";
import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";

export async function DELETE(c: Context) {
  const modelId = uuidSchema.parse(c.req.param("modelId"));

  const user = c.get("user");

  const { bucketId, name } = await getModelDetails({
    modelId,
  });

  const hasPermissions = await isBucketMaintainer({
    userId: user.id,
    bucketId,
  });

  if (!hasPermissions) {
    throw new HTTPException(403, { message: "FORBIDDEN" });
  }

  await deleteModel({
    modelId,
  });

  return c.json({ name });
}
