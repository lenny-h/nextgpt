import * as z from "zod";

import { itemsPerPageSchema } from "@workspace/api-routes/schemas/items-per-page-schema.js";
import { pageNumberSchema } from "@workspace/api-routes/schemas/page-number-schema.js";
import { createUuidArrayParamSchema } from "@workspace/api-routes/schemas/uuid-array-param-schema.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { userHasPermissions } from "@workspace/api-routes/utils/user-has-permissions.js";
import { db } from "@workspace/server/drizzle/db.js";
import { files } from "@workspace/server/drizzle/schema.js";
import { inArray } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const querySchema = z
  .object({
    bucketId: uuidSchema,
    courseIds: createUuidArrayParamSchema(20),
    pageNumber: pageNumberSchema,
    itemsPerPage: itemsPerPageSchema,
  })
  .strict();

const app = new Hono().get(
  "/",
  validator("query", (value, c) => {
    const parsed = querySchema.safeParse(value);
    if (!parsed.success) {
      return c.text("BAD_REQUEST", 400);
    }
    return parsed.data;
  }),
  async (c) => {
    const { bucketId, courseIds, pageNumber, itemsPerPage } =
      c.req.valid("query");
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
      .select()
      .from(files)
      .where(inArray(files.courseId, courseIds))
      .limit(itemsPerPage)
      .offset(pageNumber * itemsPerPage);

    return c.json(result);
  }
);

export default app;
