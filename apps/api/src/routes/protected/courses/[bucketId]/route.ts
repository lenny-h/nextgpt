import { isBucketUser } from "@/src/lib/db/queries/buckets.js";
import { itemsPerPageSchema } from "@/src/schemas/items-per-page-schema.js";
import { pageNumberSchema } from "@/src/schemas/page-number-schema.js";
import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { courses } from "@workspace/server/drizzle/schema.js";
import { eq } from "drizzle-orm";
import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";

export async function GET(c: Context) {
  const bucketId = uuidSchema.parse(c.req.param("bucketId"));
  const pageNumber = pageNumberSchema.parse(c.req.query("pageNumber"));
  const itemsPerPage = itemsPerPageSchema.parse(c.req.query("itemsPerPage"));

  const user = c.get("user");

  const hasPermissions = isBucketUser({ bucketId, userId: user.id });

  if (!hasPermissions) {
    throw new HTTPException(403, { message: "FORBIDDEN" });
  }

  const result = await db
    .select({
      id: courses.id,
      name: courses.name,
      private: courses.private,
    })
    .from(courses)
    .where(eq(courses.bucketId, bucketId))
    .limit(itemsPerPage)
    .offset(pageNumber * itemsPerPage);

  return c.json(result);
}
