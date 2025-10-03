import { itemsPerPageSchema } from "@/src/schemas/items-per-page-schema.js";
import { pageNumberSchema } from "@/src/schemas/page-number-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import {
  buckets,
  courseMaintainers,
  courses,
} from "@workspace/server/drizzle/schema.js";
import { desc, eq } from "drizzle-orm";
import { type Context } from "hono";

// Get courses the user maintains
export async function GET(c: Context) {
  const pageNumber = pageNumberSchema.parse(c.req.query("pageNumber"));
  const itemsPerPage = itemsPerPageSchema.parse(c.req.query("itemsPerPage"));

  const user = c.get("user");

  const maintainedCourses = await db
    .select({
      id: courses.id,
      name: courses.name,
      description: courses.description,
      bucket_id: courses.bucketId,
      bucket_name: buckets.name,
      created_at: courses.createdAt,
      private: courses.private,
    })
    .from(courseMaintainers)
    .innerJoin(courses, eq(courseMaintainers.courseId, courses.id))
    .innerJoin(buckets, eq(courses.bucketId, buckets.id))
    .where(eq(courseMaintainers.userId, user.id))
    .orderBy(desc(courses.createdAt))
    .limit(itemsPerPage)
    .offset(pageNumber * itemsPerPage);

  return c.json({ maintainedCourses });
}
