import * as z from "zod";

import { getBucketIdByCourseId } from "@workspace/api-routes/lib/db/queries/courses.js";
import { itemsPerPageSchema } from "@workspace/api-routes/schemas/items-per-page-schema.js";
import { pageNumberSchema } from "@workspace/api-routes/schemas/page-number-schema.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { userHasPermissions } from "@workspace/api-routes/utils/user-has-permissions.js";
import { db } from "@workspace/server/drizzle/db.js";
import { files } from "@workspace/server/drizzle/schema.js";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const paramSchema = z.object({ courseId: uuidSchema }).strict();
const querySchema = z
  .object({
    pageNumber: pageNumberSchema,
    itemsPerPage: itemsPerPageSchema,
  })
  .strict();

const app = new Hono().get(
  "/",
  validator("param", (value) => {
    return paramSchema.parse(value);
  }),
  validator("query", (value) => {
    return querySchema.parse({
      pageNumber: Number(value.pageNumber),
      itemsPerPage: Number(value.itemsPerPage),
    });
  }),
  async (c) => {
    const { courseId } = c.req.valid("param");
    const { pageNumber, itemsPerPage } = c.req.valid("query");
    const user = c.get("user");

    const bucketId = await getBucketIdByCourseId({ courseId });

    const hasPermissions = userHasPermissions({
      userId: user.id,
      filterBucketId: bucketId,
      filterCourseIds: [courseId],
      filterFileIds: [],
      filterAttachments: [],
    });

    if (!hasPermissions) {
      throw new HTTPException(403, { message: "FORBIDDEN" });
    }

    const result = await db
      .select()
      .from(files)
      .where(eq(files.courseId, courseId))
      .limit(itemsPerPage)
      .offset(pageNumber * itemsPerPage);

    return c.json({ items: result });
  }
);

export default app;
