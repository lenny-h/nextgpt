import { itemsPerPageSchema } from "@/src/schemas/items-per-page-schema.js";
import { pageNumberSchema } from "@/src/schemas/page-number-schema.js";
import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { courseMaintainers, tasks } from "@workspace/server/drizzle/schema.js";
import { and, desc, eq } from "drizzle-orm";
import { type Context } from "hono";

export async function GET(c: Context) {
  const courseId = uuidSchema.parse(c.req.param("courseId"));
  const pageNumber = pageNumberSchema.parse(c.req.query("pageNumber"));
  const itemsPerPage = itemsPerPageSchema.parse(c.req.query("itemsPerPage"));

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

  return c.json(result);
}
