import { isBucketUser } from "@/src/lib/db/queries/buckets.js";
import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { models } from "@workspace/server/drizzle/schema.js";
import { eq } from "drizzle-orm";
import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";

export async function GET(c: Context) {
  const bucketId = uuidSchema.parse(c.req.param("bucketId"));

  const user = c.get("user");

  const hasPermissions = isBucketUser({
    userId: user.id,
    bucketId,
  });

  if (!hasPermissions) {
    throw new HTTPException(403, { message: "FORBIDDEN" });
  }

  const result = await db
    .select({
      id: models.id,
      name: models.name,
      description: models.description,
    })
    .from(models)
    .where(eq(models.bucketId, bucketId));

  return c.json(result);
}
