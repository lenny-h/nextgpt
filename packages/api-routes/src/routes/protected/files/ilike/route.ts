import * as z from "zod";

import { prefixSchema } from "@workspace/api-routes/schemas/prefix-schema.js";
import { createUuidArrayParamSchema } from "@workspace/api-routes/schemas/uuid-array-param-schema.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { userHasPermissions } from "@workspace/api-routes/utils/user-has-permissions.js";
import { db } from "@workspace/server/drizzle/db.js";
import { files } from "@workspace/server/drizzle/schema.js";
import { and, desc, ilike, inArray, sql } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const querySchema = z
  .object({
    prefix: prefixSchema,
    bucketId: uuidSchema,
    courseIds: createUuidArrayParamSchema(20),
  })
  .strict();

const app = new Hono().get(
  "/",
  validator("query", (value, c) => {
    const parsed = querySchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }
    return parsed.data;
  }),
  async (c) => {
    const { prefix, bucketId, courseIds } = c.req.valid("query");
    const user = c.get("user");

    const hasPermissions = userHasPermissions({
      userId: user.id,
      filterBucketId: bucketId,
      filterCourseIds: courseIds,
      filterFileIds: [],
      filterAttachments: [],
      filterDocumentIds: [],
      filterPromptIds: [],
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

    return c.json(result);
  }
);

export default app;
