import { prefixSchema } from "@/src/schemas/prefix-schema.js";
import { uuidArrayParamSchema } from "@/src/schemas/uuid-array-param-schema.js";
import { userHasPermissions } from "@/src/utils/user-has-permissions.js";
import { db } from "@workspace/server/drizzle/db.js";
import { files } from "@workspace/server/drizzle/schema.js";
import { and, desc, ilike, inArray, sql } from "drizzle-orm";
import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";

export async function GET(c: Context) {
  const prefix = prefixSchema.parse(c.req.query("prefix"));
  const courseIds = uuidArrayParamSchema.parse(c.req.query("courseIds"));

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

  const results = await db
    .select({
      id: files.id,
      courseId: files.courseId,
      name: files.name,
      size: files.size,
      createdAt: files.createdAt,
    })
    .from(files)
    .where(
      and(
        inArray(files.courseId, courseIds),
        ilike(files.name, sql`${prefix} || '%'`)
      )
    )
    .orderBy(desc(files.createdAt))
    .limit(5);

  return c.json(results);
}
