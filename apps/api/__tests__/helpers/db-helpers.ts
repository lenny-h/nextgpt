import { db } from "@workspace/server/drizzle/db.js";
import {
  bucketMaintainerInvitations,
  buckets,
  bucketUserRoles,
  chats,
  courses,
  courseUserRoles,
  documents,
  files,
  models,
  prompts,
  tasks,
  type BucketType,
  type TaskStatus,
} from "@workspace/server/drizzle/schema.js";
import { eq } from "drizzle-orm";
import { TEST_USER_IDS } from "./auth-helpers.js";

/**
 * Cleanup helpers for test data
 * These functions should be called in afterAll or afterEach hooks
 */

/**
 * Create a test bucket directly in the database
 * Returns the bucket ID
 */
export async function createTestBucket(
  userId: string,
  name: string = `test-bucket-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  type: BucketType = "small"
): Promise<string> {
  const maxSizes: Record<BucketType, number> = {
    small: 1024 * 1024 * 100, // 100MB
    medium: 1024 * 1024 * 500, // 500MB
    large: 1024 * 1024 * 1024, // 1GB
    org: 1024 * 1024 * 1024 * 10, // 10GB
  };

  const [bucket] = await db
    .insert(buckets)
    .values({
      owner: userId,
      name,
      type,
      maxSize: maxSizes[type],
      size: 0,
      public: false,
    })
    .returning({ id: buckets.id });

  if (!bucket) {
    throw new Error("Failed to create test bucket");
  }

  // Add the user as a maintainer of the bucket
  await db.insert(bucketUserRoles).values({
    bucketId: bucket.id,
    userId,
    role: "maintainer",
  });

  return bucket.id;
}

/**
 * Create a test course directly in the database
 * Returns the course ID
 */
export async function createTestCourse(
  userId: string,
  bucketId: string,
  name: string = "test-course",
  description: string = "Test Course Description",
  isPrivate: boolean = false
): Promise<string> {
  const [course] = await db
    .insert(courses)
    .values({
      bucketId,
      name,
      description,
      private: isPrivate,
    })
    .returning({ id: courses.id });

  if (!course) {
    throw new Error("Failed to create test course");
  }

  // Add the user as a maintainer of the course
  await db.insert(courseUserRoles).values({
    courseId: course.id,
    userId,
    role: "maintainer",
  });

  return course.id;
}

/**
 * Create a test file directly in the database
 * Returns the file ID
 */
export async function createTestFile(
  courseId: string,
  name: string = "test-file",
  size: number = 1024,
  pagesCount: number = 1
): Promise<string> {
  const [file] = await db
    .insert(files)
    .values({
      courseId,
      name,
      size,
      pagesCount,
    })
    .returning({ id: files.id });

  if (!file) {
    throw new Error("Failed to create test file");
  }

  return file.id;
}

/**
 * Create a test task directly in the database
 * Returns the task ID
 */
export async function createTestTask(
  courseId: string,
  name: string = "test-task",
  fileSize: number = 1024,
  status: TaskStatus = "scheduled"
): Promise<string> {
  const [task] = await db
    .insert(tasks)
    .values({
      courseId,
      name,
      fileSize,
      status,
    })
    .returning({ id: tasks.id });

  if (!task) {
    throw new Error("Failed to create test task");
  }

  return task.id;
}

/**
 * Add a user as a maintainer to a bucket
 */
export async function addBucketMaintainer(
  bucketId: string,
  userId: string
): Promise<void> {
  await db
    .insert(bucketUserRoles)
    .values({
      bucketId,
      userId,
      role: "maintainer",
    })
    .onConflictDoNothing();
}

/**
 * Add a user as a maintainer to a course
 */
export async function addCourseMaintainer(
  courseId: string,
  userId: string
): Promise<void> {
  await db
    .insert(courseUserRoles)
    .values({
      courseId,
      userId,
      role: "maintainer",
    })
    .onConflictDoNothing();
}

/**
 * Delete all prompts for a specific user
 */
export async function cleanupUserPrompts(userId: string) {
  try {
    await db.delete(prompts).where(eq(prompts.userId, userId));
  } catch (error) {
    console.error("Error cleaning up prompts:", error);
  }
}

/**
 * Delete all chats for a specific user
 */
export async function cleanupUserChats(userId: string) {
  try {
    await db.delete(chats).where(eq(chats.userId, userId));
  } catch (error) {
    console.error("Error cleaning up chats:", error);
  }
}

/**
 * Delete all documents for a specific user
 */
export async function cleanupUserDocuments(userId: string) {
  try {
    await db.delete(documents).where(eq(documents.userId, userId));
  } catch (error) {
    console.error("Error cleaning up documents:", error);
  }
}

/**
 * Delete all buckets owned by a specific user
 * Cleanup courses first due to foreign key constraints
 */
export async function cleanupUserBuckets(userId: string) {
  try {
    const userBuckets = await db
      .select({ id: buckets.id })
      .from(buckets)
      .where(eq(buckets.owner, userId));

    for (const bucket of userBuckets) {
      await cleanupBucketCourses(bucket.id);
      await cleanupBucketUserRoles(bucket.id);
      await cleanupBucketModels(bucket.id);
      await cleanupBucketMaintainerInvitations(bucket.id);
    }

    await db.delete(buckets).where(eq(buckets.owner, userId));
  } catch (error) {
    console.error("Error cleaning up buckets:", error);
  }
}

/**
 * Delete all courses for a specific bucket
 */
export async function cleanupBucketCourses(bucketId: string) {
  try {
    const bucketCourses = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.bucketId, bucketId));

    for (const course of bucketCourses) {
      await cleanupCourseFiles(course.id);
      await cleanupCourseTasks(course.id);
    }

    await db.delete(courses).where(eq(courses.bucketId, bucketId));
  } catch (error) {
    console.error("Error cleaning up courses:", error);
  }
}

/**
 * Delete all user roles for a specific bucket
 */
export async function cleanupBucketUserRoles(bucketId: string) {
  try {
    await db
      .delete(bucketUserRoles)
      .where(eq(bucketUserRoles.bucketId, bucketId));
  } catch (error) {
    console.error("Error cleaning up bucket user roles:", error);
  }
}

/**
 * Delete all maintainer invitations for a specific bucket
 */
export async function cleanupBucketMaintainerInvitations(bucketId: string) {
  try {
    await db
      .delete(bucketMaintainerInvitations)
      .where(eq(bucketMaintainerInvitations.bucketId, bucketId));
  } catch (error) {
    console.error("Error cleaning up bucket maintainer invitations:", error);
  }
}

/**
 * Delete all files for a specific course
 */
export async function cleanupCourseFiles(courseId: string) {
  try {
    await db.delete(files).where(eq(files.courseId, courseId));
  } catch (error) {
    console.error("Error cleaning up files:", error);
  }
}

/**
 * Delete all models for a specific bucket
 */
export async function cleanupBucketModels(bucketId: string) {
  try {
    await db.delete(models).where(eq(models.bucketId, bucketId));
  } catch (error) {
    console.error("Error cleaning up models:", error);
  }
}

/**
 * Delete all tasks for a specific course
 */
export async function cleanupCourseTasks(courseId: string) {
  try {
    await db.delete(tasks).where(eq(tasks.courseId, courseId));
  } catch (error) {
    console.error("Error cleaning up tasks:", error);
  }
}

/**
 * Comprehensive cleanup for all test users
 * This should be called in a global afterAll hook or test suite teardown
 */
export async function cleanupAllTestData() {
  try {
    const testUserIds = Object.values(TEST_USER_IDS);

    // Clean up all user-related data
    for (const userId of testUserIds) {
      await cleanupUserPrompts(userId);
      await cleanupUserChats(userId);
      await cleanupUserDocuments(userId);
      await cleanupUserBuckets(userId);
    }

    console.log("Test data cleanup completed");
  } catch (error) {
    console.error("Error during test data cleanup:", error);
  }
}

/**
 * Cleanup data for a specific test user
 */
export async function cleanupTestUser(userId: string) {
  try {
    await cleanupUserPrompts(userId);
    await cleanupUserChats(userId);
    await cleanupUserDocuments(userId);
    await cleanupUserBuckets(userId);
  } catch (error) {
    console.error(`Error cleaning up test user ${userId}:`, error);
  }
}
