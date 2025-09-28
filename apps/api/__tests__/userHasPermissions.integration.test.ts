import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { type Filter } from "../src/schemas/filter-schema.js";
import { type PracticeFilter } from "../src/schemas/practice-filter-schema.js";
import { createServiceClient } from "../src/utils/supabase/service-client.js";
import { userHasPermissions } from "../src/utils/user-has-permissions.js";
import {
  cleanupTestData,
  generateTestData,
  TEST_USERS,
} from "./db/queries/config/utils.js";

// Mock server-only module
vi.mock("server-only", () => {
  return {
    // mock server-only module
  };
});

describe("userHasPermissions Integration Tests", () => {
  const testBuckets: { id: string }[] = [];
  const testCourses: { id: string }[] = [];
  const testFiles: { id: string }[] = [];

  const testUserId = TEST_USERS.user1.id;
  const otherUserId = TEST_USERS.user2.id;
  let testBucketId: string;
  let testCourseId1: string;
  let testCourseId2: string;
  let testFileId1: string;
  let testFileId2: string;

  const supabase = createServiceClient();

  beforeAll(async () => {
    // Create test data
    const testData1 = generateTestData();
    const testData2 = generateTestData();
    const testData3 = generateTestData();
    const testData4 = generateTestData();
    const testData5 = generateTestData();

    testBucketId = testData1.uuid;
    testCourseId1 = testData2.uuid;
    testCourseId2 = testData3.uuid;
    testFileId1 = testData4.uuid;
    testFileId2 = testData5.uuid;

    // Create test bucket
    const { error: bucketError } = await supabase.from("buckets").insert({
      id: testBucketId,
      name: "Test Bucket",
      owner: testUserId,
      max_size: 2 * 1024 * 1024 * 1024, // 2 GB
      type: "small",
    });

    if (bucketError) throw bucketError;
    testBuckets.push({ id: testBucketId });

    // Create test courses
    const { error: courseError } = await supabase.from("courses").insert([
      {
        id: testCourseId1,
        name: "Test Course 1",
        bucket_id: testBucketId,
      },
      {
        id: testCourseId2,
        name: "Test Course 2",
        bucket_id: testBucketId,
      },
    ]);

    if (courseError) throw courseError;
    testCourses.push({ id: testCourseId1 }, { id: testCourseId2 });

    // Create test files
    const { error: fileError } = await supabase.from("files").insert([
      {
        id: testFileId1,
        course_id: testCourseId1,
        name: "Test File 1",
        size: 1000,
      },
      {
        id: testFileId2,
        course_id: testCourseId2,
        name: "Test File 2",
        size: 1500,
      },
    ]);

    if (fileError) throw fileError;
    testFiles.push({ id: testFileId1 }, { id: testFileId2 });

    // Create bucket user relationship for testUserId
    const { error: bucketUserError } = await supabase
      .from("bucket_users")
      .insert({
        bucket_id: testBucketId,
        user_id: testUserId,
      });

    if (bucketUserError) throw bucketUserError;
  });

  afterAll(async () => {
    // Clean up test data
    await supabase
      .from("bucket_users")
      .delete()
      .eq("bucket_id", testBucketId)
      .eq("user_id", testUserId);

    for (const file of testFiles) {
      await cleanupTestData(supabase, "files", "id", file.id);
    }

    for (const course of testCourses) {
      await cleanupTestData(supabase, "courses", "id", course.id);
    }

    for (const bucket of testBuckets) {
      await cleanupTestData(supabase, "buckets", "id", bucket.id);
    }
  });

  it("should return true when user has cached permissions for bucket only", async () => {
    // Arrange
    const metadata = {
      bucket_ids: [testBucketId],
      course_ids: [],
      file_ids: [],
    };

    const filter: Filter = {
      bucketId: testBucketId,
      courses: [],
      files: [],
      documents: [],
    };

    // Act
    const result = await userHasPermissions({
      userId: testUserId,
      metadata,
      bucketId: filter.bucketId,
      courses: filter.courses,
      files: filter.files,
    });

    // Assert
    expect(result).toBe(true);
  });

  it("should return false when user is not a bucket user", async () => {
    // Arrange - Use a user that's not in the bucket_users table
    const metadata = {
      bucket_ids: [],
      course_ids: [],
      file_ids: [],
    };

    const filter: Filter = {
      bucketId: testBucketId,
      courses: [],
      files: [],
      documents: [],
    };

    // Act
    const result = await userHasPermissions({
      userId: otherUserId, // This user is not in bucket_users
      metadata,
      bucketId: filter.bucketId,
      courses: filter.courses,
      files: filter.files,
    });

    // Assert
    expect(result).toBe(false);
  });

  it("should return true when user has permissions and courses are valid", async () => {
    // Arrange
    const metadata = {
      bucket_ids: [],
      course_ids: [],
      file_ids: [],
    };

    const filter: Filter = {
      bucketId: testBucketId,
      courses: [testCourseId1, testCourseId2],
      files: [],
      documents: [],
    };

    // Mock the updateUserById to avoid actually updating user metadata
    const updateUserByIdSpy = vi
      .spyOn(supabase.auth.admin, "updateUserById")
      .mockResolvedValue({
        data: { user: {} as any },
        error: null,
      } as any);

    // Act
    const result = await userHasPermissions({
      userId: testUserId,
      metadata,
      bucketId: filter.bucketId,
      courses: filter.courses,
      files: filter.files,
    });

    // Assert
    expect(result).toBe(true);
    expect(updateUserByIdSpy).toHaveBeenCalledWith(testUserId, {
      app_metadata: {
        bucket_ids: [testBucketId],
        course_ids: [testCourseId1, testCourseId2],
        file_ids: [],
      },
    });

    updateUserByIdSpy.mockRestore();
  });

  it("should return false when courses are not valid in bucket", async () => {
    // Arrange
    const metadata = {
      bucket_ids: [],
      course_ids: [],
      file_ids: [],
    };

    const invalidCourseId = "00000000-0000-0000-0000-000000000000";
    const filter: Filter = {
      bucketId: testBucketId,
      courses: [testCourseId1, invalidCourseId], // One valid, one invalid
      files: [],
      documents: [],
    };

    // Act
    const result = await userHasPermissions({
      userId: testUserId,
      metadata,
      bucketId: filter.bucketId,
      courses: filter.courses,
      files: filter.files,
    });

    // Assert
    expect(result).toBe(false);
  });

  it("should handle files and derive course IDs from files", async () => {
    // Arrange
    const metadata = {
      bucket_ids: [],
      course_ids: [],
      file_ids: [],
    };

    const filter: Filter = {
      bucketId: testBucketId,
      courses: [testCourseId1],
      files: [testFileId1, testFileId2],
      documents: [],
    };

    const updateUserByIdSpy = vi
      .spyOn(supabase.auth.admin, "updateUserById")
      .mockResolvedValue({
        data: { user: {} as any },
        error: null,
      } as any);

    // Act
    const result = await userHasPermissions({
      userId: testUserId,
      metadata,
      bucketId: filter.bucketId,
      courses: filter.courses,
      files: filter.files,
    });

    // Assert
    expect(result).toBe(true);
    expect(updateUserByIdSpy).toHaveBeenCalledWith(testUserId, {
      app_metadata: {
        bucket_ids: [testBucketId],
        course_ids: [testCourseId1, testCourseId2],
        file_ids: [testFileId1, testFileId2],
      },
    });

    updateUserByIdSpy.mockRestore();
  });

  it("should handle PracticeFilter with file objects", async () => {
    // Arrange
    const metadata = {
      bucket_ids: [],
      course_ids: [],
      file_ids: [],
    };

    const filter: PracticeFilter = {
      bucketId: testBucketId,
      courses: [testCourseId1],
      files: [
        { id: testFileId1, chapters: [1, 2] },
        { id: testFileId2, chapters: [] },
      ],
      studyMode: "concepts",
    };

    const updateUserByIdSpy = vi
      .spyOn(supabase.auth.admin, "updateUserById")
      .mockResolvedValue({
        data: { user: {} as any },
        error: null,
      } as any);

    // Act
    const result = await userHasPermissions({
      userId: testUserId,
      metadata,
      bucketId: filter.bucketId,
      courses: filter.courses,
      files: filter.files.map((f) => f.id),
    });

    // Assert
    expect(result).toBe(true);
    expect(updateUserByIdSpy).toHaveBeenCalledWith(testUserId, {
      app_metadata: {
        bucket_ids: [testBucketId],
        course_ids: [testCourseId1, testCourseId2],
        file_ids: [testFileId1, testFileId2],
      },
    });

    updateUserByIdSpy.mockRestore();
  });

  it("should return true when permissions are cached", async () => {
    // Arrange
    const metadata = {
      bucket_ids: [testBucketId],
      course_ids: [testCourseId1, testCourseId2],
      file_ids: [testFileId1, testFileId2],
    };

    const filter: Filter = {
      bucketId: testBucketId,
      courses: [testCourseId1],
      files: [testFileId1],
      documents: [],
    };

    const updateUserByIdSpy = vi.spyOn(supabase.auth.admin, "updateUserById");

    // Act
    const result = await userHasPermissions({
      userId: testUserId,
      metadata,
      bucketId: filter.bucketId,
      courses: filter.courses,
      files: filter.files,
    });

    // Assert
    expect(result).toBe(true);
    expect(updateUserByIdSpy).not.toHaveBeenCalled(); // Should not update when permissions are cached

    updateUserByIdSpy.mockRestore();
  });

  it("should handle empty courses and files", async () => {
    // Arrange
    const metadata = {
      bucket_ids: [],
      course_ids: [],
      file_ids: [],
    };

    const filter: Filter = {
      bucketId: testBucketId,
      courses: [],
      files: [],
      documents: [],
    };

    const updateUserByIdSpy = vi
      .spyOn(supabase.auth.admin, "updateUserById")
      .mockResolvedValue({
        data: { user: {} as any },
        error: null,
      } as any);

    // Act
    const result = await userHasPermissions({
      userId: testUserId,
      metadata,
      bucketId: filter.bucketId,
      courses: filter.courses,
      files: filter.files,
    });

    // Assert
    expect(result).toBe(true);
    expect(updateUserByIdSpy).toHaveBeenCalledWith(testUserId, {
      app_metadata: {
        bucket_ids: [testBucketId],
        course_ids: [],
        file_ids: [],
      },
    });

    updateUserByIdSpy.mockRestore();
  });

  it("should handle partial cached permissions", async () => {
    // Arrange - user has bucket cached but not course/file permissions
    const metadata = {
      bucket_ids: [testBucketId],
      course_ids: [], // Missing course permissions
      file_ids: [], // Missing file permissions
    };

    const filter: Filter = {
      bucketId: testBucketId,
      courses: [testCourseId1],
      files: [testFileId1],
      documents: [],
    };

    const updateUserByIdSpy = vi
      .spyOn(supabase.auth.admin, "updateUserById")
      .mockResolvedValue({
        data: { user: {} as any },
        error: null,
      } as any);

    // Act
    const result = await userHasPermissions({
      userId: testUserId,
      metadata,
      bucketId: filter.bucketId,
      courses: filter.courses,
      files: filter.files,
    });

    // Assert
    expect(result).toBe(true);
    expect(updateUserByIdSpy).toHaveBeenCalledWith(testUserId, {
      app_metadata: {
        bucket_ids: [testBucketId],
        course_ids: [testCourseId1],
        file_ids: [testFileId1],
      },
    });

    updateUserByIdSpy.mockRestore();
  });

  it("should return false when user is not bucket owner and not in bucket_users", async () => {
    // Arrange - Create a bucket owned by someone else
    const testData = generateTestData();
    const otherBucketId = testData.uuid;

    const { error: bucketError } = await supabase.from("buckets").insert({
      id: otherBucketId,
      name: "Other Bucket",
      owner: otherUserId, // Different owner
      max_size: 1024 * 1024 * 1024,
      type: "small",
    });

    if (bucketError) throw bucketError;
    testBuckets.push({ id: otherBucketId });

    const metadata = {
      bucket_ids: [],
      course_ids: [],
      file_ids: [],
    };

    const filter: Filter = {
      bucketId: otherBucketId,
      courses: [],
      files: [],
      documents: [],
    };

    // Act
    const result = await userHasPermissions({
      userId: testUserId, // This user doesn't have access to otherBucketId
      metadata,
      bucketId: filter.bucketId,
      courses: filter.courses,
      files: filter.files,
    });

    // Assert
    expect(result).toBe(false);
  });
});
