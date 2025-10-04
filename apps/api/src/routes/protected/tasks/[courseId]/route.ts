import { itemsPerPageSchema } from "@/src/schemas/items-per-page-schema.js";
import { pageNumberSchema } from "@/src/schemas/page-number-schema.js";
import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { courseMaintainers, tasks } from "@workspace/server/drizzle/schema.js";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { validator } from "hono/validator";
import * as z from "zod";

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

    const result = await db
      .select({
        id: tasks.id,
        courseId: tasks.courseId,
        name: tasks.name,
        status: tasks.status,
        createdAt: tasks.createdAt,
        pubDate: tasks.pubDate,
      })
      .from(tasks)
      .innerJoin(
        courseMaintainers,
        and(
          eq(courseMaintainers.courseId, tasks.courseId),
          eq(courseMaintainers.userId, user.id)
        )
      )
      .where(eq(tasks.courseId, courseId))
      .orderBy(desc(tasks.createdAt))
      .limit(itemsPerPage)
      .offset(pageNumber * itemsPerPage);

    return c.json({ tasks: result });
  }
);

export default app;
