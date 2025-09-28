import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("get_course_files function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let user2Client: ReturnType<typeof createSupabaseClient>;
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
    user2Client = await signInUser(
      TEST_USERS.user2.email,
      TEST_USERS.user2.password
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

    // Create a test course
    const courseData = generateTestData();
    const { data: course, error: courseError } = await serviceClient
      .from("courses")
      .insert({
        name: courseData.title,
        bucket_id: testBucketId,
        description: "Test course for files",
      })
      .select()
      .single();

    if (courseError) throw courseError;

    testCourseId = course.id;

    // Add the owner as a course maintainer
    const { error: courseMaintainerError } = await serviceClient
      .from("course_maintainers")
      .insert({
        course_id: testCourseId,
        user_id: TEST_USERS.user1.id,
      });

    if (courseMaintainerError) throw courseMaintainerError;

    // Create multiple test files for the course
    for (let i = 0; i < 5; i++) {
      const fileData = generateTestData();
      const { data: file, error: fileError } = await serviceClient
        .from("files")
        .insert({
          name: `${fileData.title}.txt`,
          course_id: testCourseId,
          size: 1024 * (i + 1), // Different sizes
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

  it("should retrieve course files", async () => {
    const { data, error } = await user1Client.rpc("get_course_files", {
      p_course_id: testCourseId,
    });

    if (error) throw error;

    expect(data.length).toBeGreaterThan(0);

    // Verify our test files are in the results
    testFileIds.forEach((testFileId) => {
      const testFile = data.find((file) => file.id === testFileId);
      expect(testFile).toBeDefined();
      expect(testFile!.course_id).toBe(testCourseId);
    });
  });

  it("should respect pagination parameters", async () => {
    // Test with a specific page size
    const { data: singlePageData, error: singlePageError } =
      await user1Client.rpc("get_course_files", {
        p_course_id: testCourseId,
        page_number: 0,
        items_per_page: 2,
      });

    if (singlePageError) throw singlePageError;

    expect(singlePageData.length).toBeLessThanOrEqual(2);

    // Test with another page
    const { data: secondPageData, error: secondPageError } =
      await user1Client.rpc("get_course_files", {
        p_course_id: testCourseId,
        page_number: 1,
        items_per_page: 2,
      });

    if (secondPageError) throw secondPageError;

    // Ensure we're getting different data on different pages
    if (singlePageData.length > 0 && secondPageData.length > 0) {
      expect(singlePageData[0].id).not.toBe(secondPageData[0].id);
    }
  });

  // TODO: For the below test to work, the file policies need to be changed

  //   it("should not allow unauthorized users to access course files", async () => {
  //     // User2 should not be able to access User1's course files
  //     const { data, error } = await user2Client.rpc("get_course_files", {
  //       p_course_id: testCourseId,
  //     });

  //     if (error) throw error;

  //     expect(data.length).toBe(0);
  //   });

  it("should not allow unauthenticated access", async () => {
    const { data, error } = await anonymousClient.rpc("get_course_files", {
      p_course_id: testCourseId,
    });

    if (error) throw error;

    expect(data.length).toBe(0);
  });

  it("should include all required file properties in results", async () => {
    const { data, error } = await user1Client.rpc("get_course_files", {
      p_course_id: testCourseId,
      items_per_page: 1,
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
