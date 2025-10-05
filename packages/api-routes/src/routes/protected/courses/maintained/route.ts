import * as z from "zod";

import { itemsPerPageSchema } from "@workspace/api-routes/schemas/items-per-page-schema.js";
import { pageNumberSchema } from "@workspace/api-routes/schemas/page-number-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import {
  buckets,
  courseMaintainers,
  courses,
} from "@workspace/server/drizzle/schema.js";
import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { validator } from "hono/validator";

const querySchema = z
  .object({
    pageNumber: pageNumberSchema,
    itemsPerPage: itemsPerPageSchema,
  })
  .strict();

const app = new Hono().get(
  "/",
  validator("query", (value) => {
    return querySchema.parse(value);
  }),
  async (c) => {
    const { pageNumber, itemsPerPage } = c.req.valid("query");
    const user = c.get("user");

    const maintainedCourses = await db
      .select({
        id: courses.id,
        name: courses.name,
        description: courses.description,
        bucketId: courses.bucketId,
        bucketName: buckets.name,
        createdAt: courses.createdAt,
        private: courses.private,
      })
      .from(courseMaintainers)
      .innerJoin(courses, eq(courseMaintainers.courseId, courses.id))
      .innerJoin(buckets, eq(courses.bucketId, buckets.id))
      .where(eq(courseMaintainers.userId, user.id))
      .orderBy(desc(courses.createdAt))
      .limit(itemsPerPage)
      .offset(pageNumber * itemsPerPage);

    return c.json({ items: maintainedCourses });
  }
);

export default app;
