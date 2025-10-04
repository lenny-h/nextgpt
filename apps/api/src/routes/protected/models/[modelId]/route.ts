import { isBucketMaintainer } from "@/src/lib/db/queries/bucket-maintainers.js";
import { deleteModel, getModelDetails } from "@/src/lib/db/queries/models.js";
import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import * as z from "zod";

const paramSchema = z.object({ modelId: uuidSchema }).strict();

const app = new Hono().delete(
  "/",
  validator("param", (value) => {
    return paramSchema.parse(value);
  }),
  async (c) => {
    const { modelId } = c.req.valid("param");
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
);

export default app;
