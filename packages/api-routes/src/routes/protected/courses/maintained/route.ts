import * as z from "zod";

import { itemsPerPageSchema } from "@workspace/api-routes/schemas/items-per-page-schema.js";
import { pageNumberSchema } from "@workspace/api-routes/schemas/page-number-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import {
  buckets,
  courses,
  courseUserRoles,
} from "@workspace/server/drizzle/schema.js";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const querySchema = z
  .object({
    pageNumber: pageNumberSchema,
    itemsPerPage: itemsPerPageSchema,
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
      .from(courseUserRoles)
      .innerJoin(courses, eq(courseUserRoles.courseId, courses.id))
      .innerJoin(buckets, eq(courses.bucketId, buckets.id))
      .where(
        and(
          eq(courseUserRoles.userId, user.id),
          eq(courseUserRoles.role, "maintainer")
        )
      )
      .orderBy(desc(courses.createdAt))
      .limit(itemsPerPage)
      .offset(pageNumber * itemsPerPage);

    return c.json(maintainedCourses);
  }
);

export default app;
