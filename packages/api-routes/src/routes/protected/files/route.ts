import * as z from "zod";

import { itemsPerPageSchema } from "@workspace/api-routes/schemas/items-per-page-schema.js";
import { pageNumberSchema } from "@workspace/api-routes/schemas/page-number-schema.js";
import { createUuidArrayParamSchema } from "@workspace/api-routes/schemas/uuid-array-param-schema.js";
import { userHasPermissions } from "@workspace/api-routes/utils/user-has-permissions.js";
import { db } from "@workspace/server/drizzle/db.js";
import { files } from "@workspace/server/drizzle/schema.js";
import { inArray } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const querySchema = z
  .object({
    courseIds: createUuidArrayParamSchema(20),
    pageNumber: pageNumberSchema,
    itemsPerPage: itemsPerPageSchema,
  })
  .strict();

const app = new Hono().get(
  "/",
  validator("query", (value) => {
    return querySchema.parse({
      courseIds: value.courseIds,
      pageNumber: Number(value.pageNumber),
      itemsPerPage: Number(value.itemsPerPage),
    });
  }),
  async (c) => {
    const { courseIds, pageNumber, itemsPerPage } = c.req.valid("query");
    const user = c.get("user");

    const hasPermissions = userHasPermissions({
      userId: user.id,
      metadata: (user as any).app_metadata,
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

    return c.json({ items: result });
  }
);

export default app;
