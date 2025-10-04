import { prefixSchema } from "@/src/schemas/prefix-schema.js";
import { createUuidArrayParamSchema } from "@/src/schemas/uuid-array-param-schema.js";
import { userHasPermissions } from "@/src/utils/user-has-permissions.js";
import { db } from "@workspace/server/drizzle/db.js";
import { files } from "@workspace/server/drizzle/schema.js";
import { and, desc, ilike, inArray, sql } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import * as z from "zod";

const querySchema = z
  .object({
    prefix: prefixSchema,
    courseIds: createUuidArrayParamSchema(20),
  })
  .strict();

const app = new Hono().get(
  "/",
  validator("query", (value) => {
    return querySchema.parse(value);
  }),
  async (c) => {
    const { prefix, courseIds } = c.req.valid("query");
    const user = c.get("user");

    const hasPermissions = userHasPermissions({
      userId: user.id,
      metadata: (user as any).metadata,
      bucketId: "something", // TODO: fix
      courses: courseIds,
      files: [],
    });

    if (!hasPermissions) {
      throw new HTTPException(403, { message: "FORBIDDEN" });
    }

    const result = await db
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

    return c.json({ files: result });
  }
);

export default app;
