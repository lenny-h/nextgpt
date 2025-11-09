import * as z from "zod";

import { isBucketMaintainer } from "@workspace/api-routes/lib/db/queries/bucket-maintainers.js";
import {
  deleteModel,
  getModelDetails,
} from "@workspace/api-routes/lib/db/queries/models.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const paramSchema = z.object({ modelId: uuidSchema }).strict();

const app = new Hono().delete(
  "/",
  validator("param", (value, c) => {
    const parsed = paramSchema.safeParse(value);
    if (!parsed.success) {
      return c.text("BAD_REQUEST", 400);
    }
    return parsed.data;
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
