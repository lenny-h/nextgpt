import { db } from "@/drizzle/db.js";
import {
  courses,
  courseUsers,
  courseMaintainers,
  courseKeys,
} from "@/drizzle/schema.js";
import { and, eq, inArray } from "drizzle-orm";

export async function getBucketIdByCourseId({
  courseId,
}: {
  courseId: string;
}) {
  const result = await db
    .select({ bucketId: courses.bucketId })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (result.length === 0) throw new Error("Not found");
  return result[0].bucketId;
}

export async function getCourseDetails({ courseId }: { courseId: string }) {
  const result = await db
    .select({ bucketId: courses.bucketId, name: courses.name })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (result.length === 0) throw new Error("Not found");

  return {
    bucketId: result[0].bucketId,
    name: result[0].name,
  };
}

export async function isPrivate({ courseId }: { courseId: string }) {
  const result = await db
    .select({ private: courses.private })
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (result.length === 0) throw new Error("Not found");
  return result[0].private;
}

export async function validateCoursesInBucket({
  courseIds,
  bucketId,
  userId,
}: {
  courseIds: string[];
  bucketId: string;
  userId: string;
}) {
  if (courseIds.length === 0) return true;

  const coursesData = await db
    .select({ id: courses.id, private: courses.private })
    .from(courses)
    .where(and(eq(courses.bucketId, bucketId), inArray(courses.id, courseIds)));

  // Check if all requested courses exist
  if (coursesData.length !== courseIds.length) return false;

  const privateCourseIds = coursesData
    .filter((course) => course.private)
    .map((course) => course.id);

  if (privateCourseIds.length > 0) {
    const courseUsersData = await db
      .select({ courseId: courseUsers.courseId })
      .from(courseUsers)
      .where(
        and(
          inArray(courseUsers.courseId, privateCourseIds),
          eq(courseUsers.userId, userId)
        )
      );

    if (courseUsersData.length < privateCourseIds.length) {
      return false;
    }
  }

  return true;
}

export async function getCourses({ bucketId }: { bucketId: string }) {
  const result = await db
    .select()
    .from(courses)
    .where(eq(courses.bucketId, bucketId));

  return result;
}

export async function createCourse({
  name,
  description,
  bucketId,
  userId,
  encryptedKey,
}: {
  name: string;
  description: string;
  bucketId: string;
  userId: string;
  encryptedKey?: string;
}) {
  return await db.transaction(async (tx) => {
    // Insert course
    const [course] = await tx
      .insert(courses)
      .values({
        name,
        description,
        bucketId,
        private: encryptedKey !== undefined,
      })
      .returning({ id: courses.id });

    // Insert maintainer
    await tx.insert(courseMaintainers).values({
      courseId: course.id,
      userId,
    });

    // Insert encrypted key if provided
    if (encryptedKey !== undefined) {
      await tx.insert(courseKeys).values({
        courseId: course.id,
        key: encryptedKey,
      });
    }

    return course.id;
  });
}

export async function deleteCourse({ courseId }: { courseId: string }) {
  const result = await db
    .delete(courses)
    .where(eq(courses.id, courseId))
    .returning({ name: courses.name });

  if (result.length === 0) throw new Error("Course not found");
  return result[0].name;
}
