import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  deleteFile,
  getCourseFiles,
  getCourseIdByFileId,
  getCourseIdsByFileIds,
  getFileDetails,
} from "../../../src/lib/db/queries/files.js";
import { createServiceClient } from "../../../src/utils/supabase/service-client.js";
import {
  cleanupTestData,
  generateTestData,
  TEST_USERS,
} from "./config/utils.js";

// Mock server-only module
vi.mock("server-only", () => {
  return {
    // mock server-only module
  };
});

describe("files.ts query tests", async () => {
  const testFiles: { id: string }[] = [];
  const testCourses: { id: string }[] = [];
  const testBuckets: { id: string }[] = [];

  const testUserId = TEST_USERS.user1.id;
  let testUserId1 = TEST_USERS.user1.id;
  let testBucketId: string;
  let testCourseId: string;
  let testFileId: string;
  let testFileName: string;

  const supabase = createServiceClient();

  beforeAll(async () => {
    // Create a test bucket
    const bucketData = generateTestData();
    testBucketId = bucketData.uuid;

    const { error: bucketError } = await supabase
      .from("buckets")
      .insert({
        id: testBucketId,
        owner: testUserId,
        name: bucketData.title,
        max_size: 1024 * 1024 * 1024, // 1GB
        size: 0,
        type: "small",
      })
      .select()
      .single();

    if (bucketError) throw bucketError;

    testBuckets.push({ id: testBucketId });

    // Create a test course
    const courseData = generateTestData();
    testCourseId = courseData.uuid;

    const { error: courseError } = await supabase
      .from("courses")
      .insert({
        id: testCourseId,
        bucket_id: testBucketId,
        name: courseData.title,
        description: "Test course description",
      })
      .select()
      .single();

    if (courseError) throw courseError;

    testCourses.push({ id: testCourseId });

    // Add test user as course maintainer
    const { error: maintainerError } = await supabase
      .from("course_maintainers")
      .insert({
        course_id: testCourseId,
        user_id: testUserId1,
      });

    if (maintainerError) {
      throw maintainerError;
    }

    // Create a test file
    const fileData = generateTestData();
    testFileId = fileData.uuid;
    testFileName = fileData.title;

    const fileSize = 1024 * 1024; // 1MB
    const { error: fileError } = await supabase.from("files").insert({
      id: testFileId,
      course_id: testCourseId,
      name: testFileName,
      size: fileSize,
    });

    if (fileError) {
      throw fileError;
    }

    testFiles.push({ id: testFileId });

    // Update bucket size
    await supabase
      .from("buckets")
      .update({
        size: fileSize,
      })
      .eq("id", testBucketId);
  });

  afterAll(async () => {
    // Clean up test data
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

  it("should get file details", async () => {
    // Act
    const details = await getFileDetails({ fileId: testFileId });

    // Assert
    expect(details.courseId).toBe(testCourseId);
    expect(details.name).toBe(testFileName);
  });

  it("should get course files", async () => {
    // Act
    const files = await getCourseFiles({ courseId: testCourseId });

    // Assert
    expect(Array.isArray(files)).toBe(true);
    expect(files.length).toBeGreaterThanOrEqual(1);
    expect(files.some((f) => f.id === testFileId)).toBe(true);
    expect(files.find((f) => f.id === testFileId)?.name).toBe(testFileName);
  });

  it("should get course id by file id", async () => {
    // Act
    const result = await getCourseIdByFileId({ fileId: testFileId });

    // Assert
    expect(result).toBe(testCourseId);
  });

  it("should get course ids by multiple file ids", async () => {
    // Arrange
    // Create multiple test files
    const filesCount = 3;
    const fileIds: string[] = [];

    for (let i = 0; i < filesCount; i++) {
      const testData = generateTestData();
      const fileId = testData.uuid;
      const fileName = testData.title + "-" + i + ".pdf";

      const { error } = await supabase
        .from("files")
        .insert({
          id: fileId,
          course_id: testCourseId,
          name: fileName,
          size: 1024 * (i + 1), // Variable size
        })
        .select()
        .single();

      if (error) throw error;

      testFiles.push({ id: fileId });
      fileIds.push(fileId);
    }

    // Act
    const results = await getCourseIdsByFileIds({ fileIds });

    // Assert
    expect(results.length).toBe(fileIds.length);

    // All course IDs should match our test course
    results.forEach((courseId) => {
      expect(courseId).toBe(testCourseId);
    });
  });

  it("should throw error when file does not exist", async () => {
    // Arrange
    const nonExistentId = "00000000-0000-0000-0000-000000000000";

    // Act & Assert
    await expect(async () => {
      await getCourseIdByFileId({ fileId: nonExistentId });
    }).rejects.toThrow("Not found");

    await expect(async () => {
      await getFileDetails({ fileId: nonExistentId });
    }).rejects.toThrow("Not found");
  });

  it("should return empty array for non-existent file ids", async () => {
    // Arrange
    const nonExistentIds = [
      "00000000-0000-0000-0000-000000000000",
      "11111111-1111-1111-1111-111111111111",
    ];

    // Act
    const results = await getCourseIdsByFileIds({ fileIds: nonExistentIds });

    // Assert
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });

  it("should delete a file", async () => {
    // Act
    await deleteFile({ bucketId: testBucketId, fileId: testFileId });

    // Assert
    const { data: files, error } = await supabase
      .from("files")
      .select()
      .eq("id", testFileId);

    if (error) {
      throw error;
    }

    expect(files.length).toBe(0);

    // Check if bucket size was updated
    const { data: bucket, error: bucketError } = await supabase
      .from("buckets")
      .select("size")
      .eq("id", testBucketId)
      .single();

    if (bucketError) {
      throw bucketError;
    }

    expect(bucket.size).toBe(0);

    // Remove from tracking array
    const index = testFiles.findIndex((f) => f.id === testFileId);
    if (index !== -1) {
      testFiles.splice(index, 1);
    }
  });
});
