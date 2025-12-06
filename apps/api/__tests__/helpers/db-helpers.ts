import { db } from "@workspace/server/drizzle/db.js";
import {
  account,
  bucketMaintainerInvitations,
  buckets,
  bucketUserRoles,
  chats,
  chunks,
  courseKeys,
  courseMaintainerInvitations,
  courses,
  courseUserRoles,
  documents,
  feedback,
  files,
  messages,
  models,
  prompts,
  ssoProvider,
  tasks,
  toolCallDocuments,
  user,
  userInvitations,
  verification,
  type BucketType,
  type TaskStatus,
  type Role,
  type UserRole,
  type DocumentKind,
} from "@workspace/server/drizzle/schema.js";
import { eq, and } from "drizzle-orm";
import { TEST_USER_IDS } from "./auth-helpers.js";

// ==========================================
// Section 1: Create Functions
// ==========================================

export async function createTestBucket(
  userId: string,
  overrides: Partial<typeof buckets.$inferInsert> = {}
) {
  const type = overrides.type || "small";
  const maxSizes: Record<BucketType, number> = {
    small: 1024 * 1024 * 100,
    medium: 1024 * 1024 * 500,
    large: 1024 * 1024 * 1024,
    org: 1024 * 1024 * 1024 * 10,
  };

  const [record] = await db
    .insert(buckets)
    .values({
      owner: userId,
      name: `test-bucket-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      maxSize: maxSizes[type],
      size: 0,
      public: false,
      ...overrides,
    })
    .returning({ id: buckets.id });

  // Add the user as a maintainer of the bucket (default behavior preserved)
  await createTestBucketUserRole(record.id, userId, { role: "maintainer" });

  return record.id;
}

export async function createTestBucketUserRole(
  bucketId: string,
  userId: string,
  overrides: Partial<typeof bucketUserRoles.$inferInsert> = {}
) {
  await db
    .insert(bucketUserRoles)
    .values({
      bucketId,
      userId,
      role: "user",
      ...overrides,
    })
    .onConflictDoNothing();
}

export async function createTestChat(
  userId: string,
  overrides: Partial<typeof chats.$inferInsert> = {}
) {
  const [record] = await db
    .insert(chats)
    .values({
      userId,
      title: "Test Chat",
      ...overrides,
    })
    .returning({ id: chats.id });
  return record.id;
}

export async function createTestMessage(
  chatId: string,
  overrides: Partial<typeof messages.$inferInsert> = {}
) {
  const [record] = await db
    .insert(messages)
    .values({
      chatId,
      role: "user",
      parts: [],
      ...overrides,
    })
    .returning({ id: messages.id });
  return record.id;
}

export async function createTestCourse(
  userId: string,
  bucketId: string,
  overrides: Partial<typeof courses.$inferInsert> = {}
) {
  const [record] = await db
    .insert(courses)
    .values({
      bucketId,
      name: "test-course",
      description: "Test Course Description",
      private: false,
      ...overrides,
    })
    .returning({ id: courses.id });

  // Add the user as a maintainer of the course (default behavior preserved)
  await createTestCourseUserRole(record.id, userId, { role: "maintainer" });

  return record.id;
}

export async function createTestCourseUserRole(
  courseId: string,
  userId: string,
  overrides: Partial<typeof courseUserRoles.$inferInsert> = {}
) {
  await db
    .insert(courseUserRoles)
    .values({
      courseId,
      userId,
      role: "user",
      ...overrides,
    })
    .onConflictDoNothing();
}

export async function createTestCourseKey(
  courseId: string,
  overrides: Partial<typeof courseKeys.$inferInsert> = {}
) {
  await db.insert(courseKeys).values({
    courseId,
    key: "test-key",
    ...overrides,
  });
}

export async function createTestToolCallDocument(
  chatId: string,
  userId: string,
  overrides: Partial<typeof toolCallDocuments.$inferInsert> = {}
) {
  const [record] = await db
    .insert(toolCallDocuments)
    .values({
      chatId,
      userId,
      title: "Test Tool Doc",
      content: "Test Content",
      kind: "text",
      ...overrides,
    })
    .returning({ id: toolCallDocuments.id });
  return record.id;
}

export async function createTestDocument(
  userId: string,
  overrides: Partial<typeof documents.$inferInsert> = {}
) {
  const [record] = await db
    .insert(documents)
    .values({
      userId,
      title: `Test Document ${Date.now()}`,
      content: "Test Content",
      kind: "text",
      ...overrides,
    })
    .returning({ id: documents.id });
  return record.id;
}

export async function createTestFeedback(
  userId: string,
  overrides: Partial<typeof feedback.$inferInsert> = {}
) {
  await db.insert(feedback).values({
    userId,
    subject: "Test Subject",
    content: "Test Feedback Content",
    ...overrides,
  });
}

export async function createTestFile(
  courseId: string,
  overrides: Partial<typeof files.$inferInsert> = {}
) {
  const [record] = await db
    .insert(files)
    .values({
      courseId,
      name: "test-file",
      size: 1024,
      pageCount: 1,
      ...overrides,
    })
    .returning({ id: files.id });
  return record.id;
}

export async function createTestChunk(
  fileId: string,
  courseId: string,
  overrides: Partial<typeof chunks.$inferInsert> = {}
) {
  const [record] = await db
    .insert(chunks)
    .values({
      id: crypto.randomUUID(),
      fileId,
      courseId,
      fileName: "test-file",
      courseName: "test-course",
      embedding: new Array(768).fill(0.5),
      pageIndex: 0,
      content: "Test Chunk Content",
      ...overrides,
    })
    .returning({ id: chunks.id });
  return record.id;
}

export async function createTestUserInvitation(
  origin: string,
  target: string,
  bucketId: string,
  overrides: Partial<typeof userInvitations.$inferInsert> = {}
) {
  await db.insert(userInvitations).values({
    origin,
    target,
    bucketId,
    bucketName: "Test Bucket",
    ...overrides,
  });
}

export async function createTestBucketMaintainerInvitation(
  origin: string,
  target: string,
  bucketId: string,
  overrides: Partial<typeof bucketMaintainerInvitations.$inferInsert> = {}
) {
  await db.insert(bucketMaintainerInvitations).values({
    origin,
    target,
    bucketId,
    bucketName: "Test Bucket",
    ...overrides,
  });
}

export async function createTestCourseMaintainerInvitation(
  origin: string,
  target: string,
  courseId: string,
  overrides: Partial<typeof courseMaintainerInvitations.$inferInsert> = {}
) {
  await db.insert(courseMaintainerInvitations).values({
    origin,
    target,
    courseId,
    courseName: "Test Course",
    ...overrides,
  });
}

export async function createTestTask(
  courseId: string,
  overrides: Partial<typeof tasks.$inferInsert> = {}
) {
  const [record] = await db
    .insert(tasks)
    .values({
      courseId,
      name: "test-task",
      fileSize: 1024,
      status: "scheduled",
      ...overrides,
    })
    .returning({ id: tasks.id });
  return record.id;
}

export async function createTestPrompt(
  userId: string,
  overrides: Partial<typeof prompts.$inferInsert> = {}
) {
  const [record] = await db
    .insert(prompts)
    .values({
      userId,
      name: "Test Prompt",
      content: "Test Content",
      ...overrides,
    })
    .returning({ id: prompts.id });
  return record.id;
}

export async function createTestModel(
  bucketId: string,
  overrides: Partial<typeof models.$inferInsert> = {}
) {
  const [record] = await db
    .insert(models)
    .values({
      bucketId,
      name: "Test Model",
      encApiKey: "test-key",
      ...overrides,
    })
    .returning({ id: models.id });
  return record.id;
}

// ==========================================
// Section 2: Delete Functions
// ==========================================

export async function deleteTestBucket(id: string) {
  await db.delete(buckets).where(eq(buckets.id, id));
}

export async function deleteTestBucketUserRole(
  bucketId: string,
  userId: string
) {
  await db
    .delete(bucketUserRoles)
    .where(
      and(
        eq(bucketUserRoles.bucketId, bucketId),
        eq(bucketUserRoles.userId, userId)
      )
    );
}

export async function deleteTestChat(id: string) {
  await db.delete(chats).where(eq(chats.id, id));
}

export async function deleteTestMessage(id: string) {
  await db.delete(messages).where(eq(messages.id, id));
}

export async function deleteTestCourse(id: string) {
  await db.delete(courses).where(eq(courses.id, id));
}

export async function deleteTestCourseUserRole(
  courseId: string,
  userId: string
) {
  await db
    .delete(courseUserRoles)
    .where(
      and(
        eq(courseUserRoles.courseId, courseId),
        eq(courseUserRoles.userId, userId)
      )
    );
}

export async function deleteTestCourseKey(courseId: string) {
  await db.delete(courseKeys).where(eq(courseKeys.courseId, courseId));
}

export async function deleteTestToolCallDocument(id: string) {
  await db.delete(toolCallDocuments).where(eq(toolCallDocuments.id, id));
}

export async function deleteTestDocument(id: string) {
  await db.delete(documents).where(eq(documents.id, id));
}

export async function deleteTestFeedback(userId: string, createdAt: Date) {
  await db
    .delete(feedback)
    .where(and(eq(feedback.userId, userId), eq(feedback.createdAt, createdAt)));
}

export async function deleteTestFile(id: string) {
  await db.delete(files).where(eq(files.id, id));
}

export async function deleteTestChunk(id: string, courseId: string) {
  await db
    .delete(chunks)
    .where(and(eq(chunks.id, id), eq(chunks.courseId, courseId)));
}

export async function deleteTestUserInvitation(
  origin: string,
  target: string,
  bucketId: string
) {
  await db
    .delete(userInvitations)
    .where(
      and(
        eq(userInvitations.origin, origin),
        eq(userInvitations.target, target),
        eq(userInvitations.bucketId, bucketId)
      )
    );
}

export async function deleteTestBucketMaintainerInvitation(
  origin: string,
  target: string,
  bucketId: string
) {
  await db
    .delete(bucketMaintainerInvitations)
    .where(
      and(
        eq(bucketMaintainerInvitations.origin, origin),
        eq(bucketMaintainerInvitations.target, target),
        eq(bucketMaintainerInvitations.bucketId, bucketId)
      )
    );
}

export async function deleteTestCourseMaintainerInvitation(
  origin: string,
  target: string,
  courseId: string
) {
  await db
    .delete(courseMaintainerInvitations)
    .where(
      and(
        eq(courseMaintainerInvitations.origin, origin),
        eq(courseMaintainerInvitations.target, target),
        eq(courseMaintainerInvitations.courseId, courseId)
      )
    );
}

export async function deleteTestTask(id: string) {
  await db.delete(tasks).where(eq(tasks.id, id));
}

export async function deleteTestPrompt(id: string) {
  await db.delete(prompts).where(eq(prompts.id, id));
}

export async function deleteTestModel(id: string) {
  await db.delete(models).where(eq(models.id, id));
}

// ==========================================
// Section 3: High-level Cleanup Helpers
// ==========================================

export async function cleanupUserPrompts(userId: string) {
  try {
    await db.delete(prompts).where(eq(prompts.userId, userId));
  } catch (error) {
    console.error("Error cleaning up prompts:", error);
  }
}

export async function cleanupUserChats(userId: string) {
  try {
    await db.delete(chats).where(eq(chats.userId, userId));
  } catch (error) {
    console.error("Error cleaning up chats:", error);
  }
}

export async function cleanupUserDocuments(userId: string) {
  try {
    await db.delete(documents).where(eq(documents.userId, userId));
  } catch (error) {
    console.error("Error cleaning up documents:", error);
  }
}

export async function cleanupUserFeedback(userId: string) {
  try {
    await db.delete(feedback).where(eq(feedback.userId, userId));
  } catch (error) {
    console.error("Error cleaning up feedback:", error);
  }
}

export async function cleanupTestCourse(courseId: string) {
  try {
    // Cleanup dependent resources for the course
    await db.delete(files).where(eq(files.courseId, courseId));
    await db.delete(tasks).where(eq(tasks.courseId, courseId));
    await db.delete(chunks).where(eq(chunks.courseId, courseId));
    await db.delete(courseKeys).where(eq(courseKeys.courseId, courseId));
    await db
      .delete(courseMaintainerInvitations)
      .where(eq(courseMaintainerInvitations.courseId, courseId));
    await db
      .delete(courseUserRoles)
      .where(eq(courseUserRoles.courseId, courseId));

    // Finally delete the course
    await deleteTestCourse(courseId);
  } catch (error) {
    console.error(`Error cleaning up course ${courseId}:`, error);
  }
}

export async function cleanupBucketCourses(bucketId: string) {
  try {
    const bucketCourses = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.bucketId, bucketId));

    for (const course of bucketCourses) {
      await cleanupTestCourse(course.id);
    }
  } catch (error) {
    console.error("Error cleaning up courses:", error);
  }
}

export async function cleanupUserBucket(bucketId: string) {
  try {
    await cleanupBucketCourses(bucketId);

    // Cleanup bucket user roles
    await db
      .delete(bucketUserRoles)
      .where(eq(bucketUserRoles.bucketId, bucketId));

    // Cleanup bucket models
    await db.delete(models).where(eq(models.bucketId, bucketId));

    // Cleanup bucket invitations
    await db
      .delete(bucketMaintainerInvitations)
      .where(eq(bucketMaintainerInvitations.bucketId, bucketId));
    await db
      .delete(userInvitations)
      .where(eq(userInvitations.bucketId, bucketId));

    // Finally delete the bucket
    await deleteTestBucket(bucketId);
  } catch (error) {
    console.error("Error cleaning up bucket:", error);
  }
}

export async function cleanupUserBuckets(userId: string) {
  try {
    const userBuckets = await db
      .select({ id: buckets.id })
      .from(buckets)
      .where(eq(buckets.owner, userId));

    for (const bucket of userBuckets) {
      await cleanupUserBucket(bucket.id);
    }
  } catch (error) {
    console.error("Error cleaning up buckets:", error);
  }
}

export async function cleanupAllTestData() {
  try {
    const testUserIds = Object.values(TEST_USER_IDS);

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

export const addBucketMaintainer = async (bucketId: string, userId: string) =>
  createTestBucketUserRole(bucketId, userId, { role: "maintainer" });

export const addCourseMaintainer = async (courseId: string, userId: string) =>
  createTestCourseUserRole(courseId, userId, { role: "maintainer" });
