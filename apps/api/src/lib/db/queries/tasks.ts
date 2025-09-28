import { db } from "@workspace/server/drizzle/db.js";
import { buckets, courses, tasks } from "@workspace/server/drizzle/schema.js";
import { eq, sql } from "drizzle-orm";

export async function getTaskDetails({ taskId }: { taskId: string }) {
  const result = await db
    .select({
      courseId: tasks.courseId,
      name: tasks.name,
      status: tasks.status,
    })
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);

  if (result.length === 0) throw new Error("Task not found");
  return result[0];
}

export async function addTask({
  id,
  courseId,
  filename,
  fileSize,
  pubDate,
}: {
  id: string;
  courseId: string;
  filename: string;
  fileSize: number;
  pubDate?: Date;
}) {
  return await db.transaction(async (tx) => {
    // Get the bucket ID for the course
    const courseResult = await tx
      .select({ bucketId: courses.bucketId })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (courseResult.length === 0) {
      throw new Error("Course not found");
    }

    const bucketId = courseResult[0].bucketId;

    // Insert the task
    await tx.insert(tasks).values({
      id,
      courseId,
      fileSize,
      name: filename,
      pubDate,
    });

    // Update the bucket size
    await tx
      .update(buckets)
      .set({
        size: sql`${buckets.size} + ${fileSize}`,
      })
      .where(eq(buckets.id, bucketId));
  });
}

export async function deleteTask({ taskId }: { taskId: string }) {
  const result = await db
    .delete(tasks)
    .where(eq(tasks.id, taskId))
    .returning({ id: tasks.id });

  if (result.length === 0) {
    throw new Error("Task not found");
  }
}
