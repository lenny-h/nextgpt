import { db } from "@workspace/server/drizzle/db.js";
import {
  buckets,
  chats,
  courses,
  documents,
  files,
  models,
  prompts,
  tasks,
} from "@workspace/server/drizzle/schema.js";
import { eq } from "drizzle-orm";
import { TEST_USER_IDS } from "./auth-helpers.js";

/**
 * Cleanup helpers for test data
 * These functions should be called in afterAll or afterEach hooks
 */

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
    await db.delete(courses).where(eq(courses.bucketId, bucketId));
  } catch (error) {
    console.error("Error cleaning up courses:", error);
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
