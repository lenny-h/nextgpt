import * as z from "zod";

import { itemsPerPageSchema } from "@workspace/api-routes/schemas/items-per-page-schema.js";
import { pageNumberSchema } from "@workspace/api-routes/schemas/page-number-schema.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { courseUserRoles, tasks } from "@workspace/server/drizzle/schema.js";
import { and, desc, eq } from "drizzle-orm";
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
  validator("param", (value, c) => {
    const parsed = paramSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }
    return parsed.data;
  }),
  validator("query", (value, c) => {
    const parsed = querySchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }
    return parsed.data;
  }),
  async (c) => {
    const { courseId } = c.req.valid("param");
    const { pageNumber, itemsPerPage } = c.req.valid("query");
    const user = c.get("user");

    const result = await db
      .select({
        id: tasks.id,
        courseId: tasks.courseId,
        name: tasks.name,
        status: tasks.status,
        createdAt: tasks.createdAt,
        pubDate: tasks.pubDate,
        errorMessage: tasks.errorMessage,
      })
      .from(tasks)
      .innerJoin(courseUserRoles, eq(courseUserRoles.courseId, tasks.courseId))
      .where(
        and(
          eq(tasks.courseId, courseId),
          eq(courseUserRoles.userId, user.id),
          eq(courseUserRoles.role, "maintainer")
        )
      )
      .orderBy(desc(tasks.createdAt))
      .limit(itemsPerPage)
      .offset(pageNumber * itemsPerPage);

    return c.json(result);
  }
);

export default app;
