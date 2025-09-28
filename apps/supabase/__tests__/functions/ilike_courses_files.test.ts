import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("ilike_courses_files function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let testBucketId: string;
  let testCourseId: string;
  let testFileIds: string[] = [];

  beforeAll(async () => {
    user1Client = await signInUser(
      TEST_USERS.user1.email,
      TEST_USERS.user1.password
    );
    anonymousClient = createUnauthenticatedClient();
    serviceClient = createServiceClient();

    // Create a test bucket for user1
    const bucketData = generateTestData();
    const { data: bucket, error: bucketError } = await serviceClient
      .from("buckets")
      .insert({
        owner: TEST_USERS.user1.id,
        name: bucketData.title,
        max_size: 100 * 1024 * 1024,
        type: "small",
        users_count: 1,
      })
      .select()
      .single();

    if (bucketError) throw bucketError;

    testBucketId = bucket.id;

    // Add the owner as a bucket user
    const { error: bucketUserError } = await serviceClient
      .from("bucket_users")
      .insert({
        bucket_id: testBucketId,
        user_id: TEST_USERS.user1.id,
      });

    if (bucketUserError) throw bucketUserError;

    // Create a test course
    const courseData = generateTestData();
    const { data: course, error: courseError } = await serviceClient
      .from("courses")
      .insert({
        name: courseData.title,
        bucket_id: testBucketId,
        description: "Test course for file search",
      })
      .select()
      .single();

    if (courseError) throw courseError;

    testCourseId = course.id;

    // Add user1 as a course maintainer
    const { error: maintainerError } = await serviceClient
      .from("course_maintainers")
      .insert({
        course_id: course.id,
        user_id: TEST_USERS.user1.id,
      });

    if (maintainerError) throw maintainerError;

    // Create test files with different prefixes
    const prefixesToTest = [
      "A_test",
      "B_test",
      "C_test",
      "Test_file",
      "Something_else",
    ];

    for (let i = 0; i < prefixesToTest.length; i++) {
      const { data: file, error: fileError } = await serviceClient
        .from("files")
        .insert({
          course_id: testCourseId,
          name: `${prefixesToTest[i]}_${i + 1}.pdf`,
          size: 1024 * (i + 1), // Different sizes for each file
        })
        .select()
        .single();

      if (fileError) throw fileError;

      testFileIds.push(file.id);
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (testFileIds.length > 0) {
      await serviceClient.from("files").delete().in("id", testFileIds);
    }
    if (testCourseId) {
      await serviceClient.from("courses").delete().eq("id", testCourseId);
    }
    if (testBucketId) {
      await serviceClient.from("buckets").delete().eq("id", testBucketId);
    }
  });

  it("should find files with names starting with the specified prefix", async () => {
    const { data, error } = await user1Client.rpc("ilike_courses_files", {
      p_course_ids: [testCourseId],
      prefix: "Test",
    });

    if (error) throw error;

    expect(data.length).toBeGreaterThan(0);
    data.forEach((file) => {
      expect(file.name.toLowerCase()).toMatch(/^test/i);
      expect(file.course_id).toBe(testCourseId);
    });
  });

  it("should return multiple files matching the prefix", async () => {
    const { data, error } = await user1Client.rpc("ilike_courses_files", {
      p_course_ids: [testCourseId],
      prefix: "A",
    });

    if (error) throw error;

    expect(data.length).toBeGreaterThan(0);
    data.forEach((file) => {
      expect(file.name.toLowerCase()).toMatch(/^a/i);
    });
  });

  it("should handle case-insensitive search", async () => {
    const { data: lowerCaseData, error: lowerCaseError } =
      await user1Client.rpc("ilike_courses_files", {
        p_course_ids: [testCourseId],
        prefix: "test",
      });

    if (lowerCaseError) throw lowerCaseError;

    const { data: upperCaseData, error: upperCaseError } =
      await user1Client.rpc("ilike_courses_files", {
        p_course_ids: [testCourseId],
        prefix: "TEST",
      });

    if (upperCaseError) throw upperCaseError;

    // Both searches should return files that start with "test" regardless of case
    expect(lowerCaseData.length).toBeGreaterThan(0);
    expect(upperCaseData.length).toBeGreaterThan(0);
    expect(lowerCaseData.length).toBe(upperCaseData.length);
  });

  it("should return empty array for non-matching prefix", async () => {
    const { data, error } = await user1Client.rpc("ilike_courses_files", {
      p_course_ids: [testCourseId],
      prefix: "NonExistent",
    });

    if (error) throw error;

    expect(data.length).toBe(0);
  });

  // TODO: For the below test to work, the file policies need to be changed

  // it("should not allow unauthorized users to search files", async () => {
  //   // User2 should not be able to search User1's course files
  //   const { data, error } = await user2Client.rpc("ilike_courses_files", {
  //     p_course_ids: [testCourseId],
  //     prefix: "Test",
  //   });

  //   if (error) throw error;

  //   expect(data.length).toBe(0);
  // });

  it("should not allow unauthenticated access", async () => {
    const { data, error } = await anonymousClient.rpc("ilike_courses_files", {
      p_course_ids: [testCourseId],
      prefix: "Test",
    });

    if (error) throw error;

    expect(data.length).toBe(0);
  });

  it("should include all required file properties in results", async () => {
    const { data, error } = await user1Client.rpc("ilike_courses_files", {
      p_course_ids: [testCourseId],
      prefix: "A",
    });

    if (error) throw error;

    if (data.length > 0) {
      const file = data[0];
      expect(file).toHaveProperty("id");
      expect(file).toHaveProperty("course_id");
      expect(file).toHaveProperty("name");
      expect(file).toHaveProperty("size");
      expect(file).toHaveProperty("created_at");
    }
  });
});
