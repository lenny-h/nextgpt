import {
  // getMaintainedBuckets, // Remove this import
  isBucketMaintainer,
} from "@/src/lib/db/queries/bucket-maintainers.js";
import { addModel } from "@/src/lib/db/queries/models.js";
import { encryptApiKey } from "@/src/utils/encryption.js";
import { db } from "@workspace/server/drizzle/db.js";
import {
  models,
  bucketMaintainers,
  buckets,
} from "@workspace/server/drizzle/schema.js";
import { eq, desc } from "drizzle-orm"; // Remove inArray, add eq
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import * as z from "zod";
import { addModelFormSchema } from "./schema.js";
import { pageNumberSchema } from "@/src/schemas/page-number-schema.js";
import { itemsPerPageSchema } from "@/src/schemas/items-per-page-schema.js";

const querySchema = z
  .object({
    pageNumber: pageNumberSchema,
    itemsPerPage: itemsPerPageSchema,
  })
  .strict();

const app = new Hono()
  .get(
    "/",
    validator("query", (value) => {
      return querySchema.parse({
        pageNumber: Number(value.pageNumber),
        itemsPerPage: Number(value.itemsPerPage),
      });
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
          bucketMaintainers,
          eq(models.bucketId, bucketMaintainers.bucketId)
        )
        .where(eq(bucketMaintainers.userId, user.id))
        .orderBy(desc(models.createdAt))
        .limit(itemsPerPage)
        .offset(pageNumber * itemsPerPage);

      return c.json({ models: result });
    }
  )
  .post(
    "/",
    validator("json", async (value, c) => {
      return addModelFormSchema.parse(value);
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
