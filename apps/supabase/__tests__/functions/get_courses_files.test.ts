import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("get_courses_files function", () => {
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

    // Add user1 as a bucket user
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
        description: "Test course for file pagination",
      })
      .select()
      .single();

    if (courseError) throw courseError;

    testCourseId = course.id;

    // Create test files
    for (let i = 0; i < 15; i++) {
      const { data: file, error: fileError } = await serviceClient
        .from("files")
        .insert({
          course_id: testCourseId,
          name: `Test_file_${i + 1}.pdf`,
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

  it("should return files with default pagination parameters", async () => {
    const { data, error } = await user1Client.rpc("get_courses_files", {
      p_course_ids: [testCourseId],
    });

    if (error) throw error;

    expect(data.length).toBeGreaterThan(0);
    expect(data.length).toBeLessThanOrEqual(10);
    data.forEach((file) => {
      expect(file.course_id).toBe(testCourseId);
    });
  });

  it("should paginate results correctly", async () => {
    const pageSize = 5;
    const page0Promise = user1Client.rpc("get_courses_files", {
      p_course_ids: [testCourseId],
      page_number: 0,
      items_per_page: pageSize,
    });

    const page1Promise = user1Client.rpc("get_courses_files", {
      p_course_ids: [testCourseId],
      page_number: 1,
      items_per_page: pageSize,
    });

    const [page0Result, page1Result] = await Promise.all([
      page0Promise,
      page1Promise,
    ]);

    if (page0Result.error) throw page0Result.error;
    if (page1Result.error) throw page1Result.error;

    const page0Data = page0Result.data;
    const page1Data = page1Result.data;

    expect(page0Data.length).toBe(pageSize);
    expect(page1Data.length).toBe(pageSize);

    // Ensure pages are different
    const page0Ids = page0Data.map((file) => file.id);
    const page1Ids = page1Data.map((file) => file.id);
    const overlappingIds = page0Ids.filter((id) => page1Ids.includes(id));
    expect(overlappingIds.length).toBe(0);
  });

  it("should return an empty array for non-existent course IDs", async () => {
    const nonExistentCourseId = "00000000-0000-0000-0000-000000000000";
    const { data, error } = await user1Client.rpc("get_courses_files", {
      p_course_ids: [nonExistentCourseId],
    });

    if (error) throw error;

    expect(data.length).toBe(0);
  });

  it("should handle multiple course IDs", async () => {
    // Create a second test course
    const courseData = generateTestData();
    const { data: course2, error: courseError } = await serviceClient
      .from("courses")
      .insert({
        name: courseData.title,
        bucket_id: testBucketId,
        description: "Second test course",
      })
      .select()
      .single();

    if (courseError) throw courseError;

    const course2Id = course2.id;

    // Add a file to the second course
    const { data: file, error: fileError } = await serviceClient
      .from("files")
      .insert({
        course_id: course2Id,
        name: "Second_course_file.pdf",
        size: 2048,
      })
      .select()
      .single();

    if (fileError) throw fileError;
    testFileIds.push(file.id);

    // Query files from both courses
    const { data, error } = await user1Client.rpc("get_courses_files", {
      p_course_ids: [testCourseId, course2Id],
    });

    if (error) throw error;

    // Verify files from both courses are included
    const courseIds = data.map((f) => f.course_id);
    expect(courseIds).toContain(testCourseId);
    expect(courseIds).toContain(course2Id);

    // Clean up second course
    await serviceClient.from("courses").delete().eq("id", course2Id);
  });

  it("should include all required file properties in results", async () => {
    const { data, error } = await user1Client.rpc("get_courses_files", {
      p_course_ids: [testCourseId],
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

  // TODO: For the below test to work, the file policies need to be changed

  //   it("should not allow unauthorized users to access files", async () => {
  //     // User2 should not be able to access the files because they are not a bucket user
  //     const { data, error } = await user2Client.rpc("get_courses_files", {
  //       p_course_ids: [testCourseId],
  //     });

  //     if (error) throw error;

  //     expect(data.length).toBe(0);
  //   });

  it("should not allow unauthenticated access", async () => {
    const { data, error } = await anonymousClient.rpc("get_courses_files", {
      p_course_ids: [testCourseId],
    });

    if (error) throw error;

    expect(data.length).toBe(0);
  });
});
