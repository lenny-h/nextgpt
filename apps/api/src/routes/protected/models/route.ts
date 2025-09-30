import {
  // getMaintainedBuckets, // Remove this import
  isBucketMaintainer,
} from "@/src/lib/db/queries/bucket-maintainers.js";
import { addModel } from "@/src/lib/db/queries/models.js";
import { encryptApiKey } from "@/src/utils/encryption.js";
import { db } from "@workspace/server/drizzle/db.js";
import { models, bucketMaintainers } from "@workspace/server/drizzle/schema.js";
import { eq } from "drizzle-orm"; // Remove inArray, add eq
import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { addModelFormSchema } from "./schema.js";
import { pageNumberSchema } from "@/src/schemas/page-number-schema.js";
import { itemsPerPageSchema } from "@/src/schemas/items-per-page-schema.js";

// Get models of all buckets the user maintains
export async function GET(c: Context) {
  const pageNumber = pageNumberSchema.parse(c.req.query("pageNumber"));
  const itemsPerPage = itemsPerPageSchema.parse(c.req.query("itemsPerPage"));

  const user = c.get("user");

  const result = await db
    .select({
      id: models.id,
      name: models.name,
      description: models.description,
    })
    .from(models)
    .innerJoin(
      bucketMaintainers,
      eq(models.bucketId, bucketMaintainers.bucketId)
    )
    .where(eq(bucketMaintainers.userId, user.id))
    .limit(itemsPerPage)
    .offset(pageNumber * itemsPerPage);

  return c.json(result);
}

// Add a new model to a bucket the user maintains
export async function POST(c: Context) {
  const user = c.get("user");

  const payload = await c.req.json();

  const {
    bucketId,
    modelName,
    resourceName,
    deploymentId,
    apiKey,
    description,
  } = addModelFormSchema.parse(payload);

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

  return c.json("Model added");
}
