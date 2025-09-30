import { itemsPerPageSchema } from "@/src/schemas/items-per-page-schema.js";
import { pageNumberSchema } from "@/src/schemas/page-number-schema.js";
import { uuidArrayParamSchema } from "@/src/schemas/uuid-array-param-schema.js";
import { userHasPermissions } from "@/src/utils/user-has-permissions.js";
import { db } from "@workspace/server/drizzle/db.js";
import { files } from "@workspace/server/drizzle/schema.js";
import { inArray } from "drizzle-orm";
import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";

export async function GET(c: Context) {
  const courseIds = uuidArrayParamSchema.parse(c.req.query("courseIds"));
  const pageNumber = pageNumberSchema.parse(c.req.query("pageNumber"));
  const itemsPerPage = itemsPerPageSchema.parse(c.req.query("itemsPerPage"));

  const user = c.get("user");

  const hasPermissions = userHasPermissions({
    userId: user.id,
    metadata: user.metadata,
    bucketId: "something", // TODO: fix
    courses: courseIds,
    files: [],
  });

  if (!hasPermissions) {
    throw new HTTPException(403, { message: "FORBIDDEN" });
  }

  const result = await db
    .select()
    .from(files)
    .where(inArray(files.courseId, courseIds))
    .limit(itemsPerPage)
    .offset(pageNumber * itemsPerPage);

  return c.json(result);
}
