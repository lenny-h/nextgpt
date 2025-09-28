import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  createCourse,
  deleteCourse,
  getBucketIdByCourseId,
  getCourseDetails,
  getCourses,
  isPrivate,
  validateCoursesInBucket,
} from "../../../src/lib/db/queries/courses.js";
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

describe("courses.ts query tests", async () => {
  const testCourses: { id: string }[] = [];
  const testBuckets: { id: string }[] = [];
  const testCourseMaintainers: { course_id: string; user_id: string }[] = [];

  let testUserId: string;
  let testUserId1: string;
  let testBucketId: string;
  let testCourseId: string;

  const supabase = createServiceClient();

  beforeAll(async () => {
    testUserId = TEST_USERS.user1.id;
    testUserId1 = TEST_USERS.user1.id;

    // Create a test bucket to use for course tests
    const testData = generateTestData();
    testBucketId = testData.uuid;

    const { error } = await supabase
      .from("buckets")
      .insert({
        id: testBucketId,
        owner: testUserId,
        name: testData.title,
        max_size: 1024 * 1024 * 1024, // 1GB
        size: 0,
        type: "small",
      })
      .select()
      .single();

    if (error) throw error;

    testBuckets.push({ id: testBucketId });
  });

  afterAll(async () => {
    // Clean up test data
    for (const maintainer of testCourseMaintainers) {
      await supabase
        .from("course_maintainers")
        .delete()
        .eq("course_id", maintainer.course_id)
        .eq("user_id", maintainer.user_id);
    }

    for (const course of testCourses) {
      await cleanupTestData(supabase, "courses", "id", course.id);
    }

    for (const bucket of testBuckets) {
      await cleanupTestData(supabase, "buckets", "id", bucket.id);
    }
  });

  it("should create a course with maintainer", async () => {
    // Arrange
    const courseName = generateTestData().title;
    const courseDescription = "Test course description";

    // Act
    const result = await createCourse({
      name: courseName,
      description: courseDescription,
      bucketId: testBucketId,
      userId: testUserId1,
    });

    // Assert
    expect(result.id).toBeTruthy();
    testCourseId = result.id;
    testCourses.push({ id: testCourseId });

    // Check if the course was created
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select()
      .eq("id", testCourseId)
      .single();

    if (courseError) {
      throw courseError;
    }

    expect(course.name).toBe(courseName);
    expect(course.description).toBe(courseDescription);
    expect(course.bucket_id).toBe(testBucketId);

    // Check if the user was added as a maintainer
    const { data: maintainers, error: maintainersError } = await supabase
      .from("course_maintainers")
      .select()
      .eq("course_id", testCourseId)
      .eq("user_id", testUserId1);

    if (maintainersError) {
      throw maintainersError;
    }

    expect(maintainers.length).toBe(1);

    testCourseMaintainers.push({
      course_id: testCourseId,
      user_id: testUserId1,
    });
  });

  it("should get bucket id by course id", async () => {
    // Act
    const result = await getBucketIdByCourseId({ courseId: testCourseId });

    // Assert
    expect(result).toBe(testBucketId);
  });

  it("should get course details", async () => {
    // Act
    const details = await getCourseDetails({ courseId: testCourseId });

    // Assert
    expect(details.bucketId).toBe(testBucketId);
    expect(details.name).toBeTruthy();
  });

  it("should check if course is private", async () => {
    // Arrange
    const testData = generateTestData();
    const courseId = testData.uuid;
    const courseName = testData.title;
    const courseIsPrivate = false; // Assuming default is false or explicitly set

    // Create a test course
    const { error } = await supabase
      .from("courses")
      .insert({
        id: courseId,
        bucket_id: testBucketId,
        name: courseName,
        private: courseIsPrivate, // Add private field
      })
      .select()
      .single();

    if (error) throw error;

    testCourses.push({ id: courseId });

    // Act
    const result = await isPrivate({ courseId });

    // Assert
    expect(result).toBe(courseIsPrivate);
  });

  it("should throw error when course does not exist", async () => {
    // Arrange
    const nonExistentId = "00000000-0000-0000-0000-000000000000";

    // Act & Assert
    await expect(async () => {
      await getBucketIdByCourseId({ courseId: nonExistentId });
    }).rejects.toThrow("Not found");

    await expect(async () => {
      await isPrivate({ courseId: nonExistentId });
    }).rejects.toThrow("Not found");
  });

  it("should validate courses in bucket", async () => {
    // Arrange
    // Create multiple test courses in the same bucket
    const coursesCount = 3;
    const courseIds: string[] = [];

    for (let i = 0; i < coursesCount; i++) {
      const testData = generateTestData();
      const courseId = testData.uuid;
      const courseName =
        `test-course-${i}-` + Math.random().toString(36).substring(7);

      const { error } = await supabase
        .from("courses")
        .insert({
          id: courseId,
          bucket_id: testBucketId,
          name: courseName,
        })
        .select()
        .single();

      if (error) throw error;

      testCourses.push({ id: courseId });
      courseIds.push(courseId);
    }

    // Act - Valid case (all courses in bucket)
    const validResult = await validateCoursesInBucket({
      courseIds,
      bucketId: testBucketId,
      userId: testUserId,
    });

    // Act - Invalid case (with a non-existent course ID)
    const invalidCourseIds = [
      ...courseIds,
      "00000000-0000-0000-0000-000000000000",
    ];
    const invalidResult = await validateCoursesInBucket({
      courseIds: invalidCourseIds,
      bucketId: testBucketId,
      userId: testUserId,
    });

    // Act - Empty case (no courses)
    const emptyResult = await validateCoursesInBucket({
      courseIds: [],
      bucketId: testBucketId,
      userId: testUserId,
    });

    // Assert
    expect(validResult).toBe(true);
    expect(invalidResult).toBe(false);
    expect(emptyResult).toBe(true);
  });

  it("should get all courses in a bucket", async () => {
    // Act
    const results = await getCourses({ bucketId: testBucketId });

    // Assert
    expect(results.length).toBeGreaterThan(0);

    // All returned courses should be in the target bucket
    results.forEach((course) => {
      expect(course.bucket_id).toBe(testBucketId);
    });
  });

  it("should delete a course", async () => {
    // Act
    const courseName = await deleteCourse({ courseId: testCourseId });

    // Assert
    expect(courseName).toBeTruthy();

    const { data: courses, error } = await supabase
      .from("courses")
      .select()
      .eq("id", testCourseId);

    if (error) {
      throw error;
    }

    expect(courses.length).toBe(0);

    // Remove from tracking array
    const index = testCourses.findIndex((c) => c.id === testCourseId);
    if (index !== -1) {
      testCourses.splice(index, 1);
    }
  });
});
