import * as z from "zod";

import { isBucketMaintainer } from "@workspace/api-routes/lib/db/queries/bucket-maintainers.js";
import { addModel } from "@workspace/api-routes/lib/db/queries/models.js";
import { itemsPerPageSchema } from "@workspace/api-routes/schemas/items-per-page-schema.js";
import { pageNumberSchema } from "@workspace/api-routes/schemas/page-number-schema.js";
import { encryptApiKey } from "@workspace/api-routes/utils/encryption.js";
import { db } from "@workspace/server/drizzle/db.js";
import {
  buckets,
  bucketUserRoles,
  models,
} from "@workspace/server/drizzle/schema.js";
import { and, desc, eq } from "drizzle-orm"; // Remove inArray, add eq
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { addModelFormSchema } from "./schema.js";

const querySchema = z
  .object({
    pageNumber: pageNumberSchema,
    itemsPerPage: itemsPerPageSchema,
  })
  .strict();

const app = new Hono()
  .get(
    "/",
    validator("query", (value, c) => {
      const parsed = querySchema.safeParse(value);
      if (!parsed.success) {
        throw new HTTPException(400, { message: "BAD_REQUEST" });
      }
      return parsed.data;
    }),
    async (c) => {
      const { pageNumber, itemsPerPage } = c.req.valid("query");

      const user = c.get("user");

      const result = await db
        .select({
          id: models.id,
          bucketId: models.bucketId,
          bucketName: buckets.name,
          name: models.name,
          description: models.description,
          createdAt: models.createdAt,
        })
        .from(models)
        .innerJoin(buckets, eq(models.bucketId, buckets.id))
        .innerJoin(
          bucketUserRoles,
          eq(models.bucketId, bucketUserRoles.bucketId)
        )
        .where(
          and(
            eq(bucketUserRoles.userId, user.id),
            eq(bucketUserRoles.role, "maintainer")
          )
        )
        .orderBy(desc(models.createdAt))
        .limit(itemsPerPage)
        .offset(pageNumber * itemsPerPage);

      return c.json(result);
    }
  )
  .post(
    "/",
    validator("json", async (value, c) => {
      const parsed = addModelFormSchema.safeParse(value);
      if (!parsed.success) {
        throw new HTTPException(400, { message: "BAD_REQUEST" });
      }
      return parsed.data;
    }),
    async (c) => {
      const {
        bucketId,
        modelName,
        resourceName,
        deploymentId,
        apiKey,
        description,
      } = c.req.valid("json");
      const user = c.get("user");

      const hasPermissions = await isBucketMaintainer({
        userId: user.id,
        bucketId,
      });

      if (!hasPermissions) {
        throw new HTTPException(403, { message: "FORBIDDEN" });
      }

      const encApiKey = encryptApiKey(apiKey);

      await addModel({
        bucketId,
        modelName,
        resourceName,
        deploymentId,
        encApiKey,
        description,
      });

      return c.json({ message: "Model added" });
    }
  );

export default app;
