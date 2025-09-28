import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("get_maintained_courses function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let user2Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let testBucketId: string;
  let testCourseIds: string[] = [];

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
        max_size: 2 * 1024 * 1024 * 1024,
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

    // Create multiple test courses in the bucket
    for (let i = 0; i < 3; i++) {
      const courseData = generateTestData();
      const { data: course, error: courseError } = await serviceClient
        .from("courses")
        .insert({
          name: courseData.title,
          bucket_id: testBucketId,
          description: `Test course description ${i + 1}`,
        })
        .select()
        .single();

      if (courseError) throw courseError;

      testCourseIds.push(course.id);

      // Add user1 as a course maintainer
      const { error: maintainerError } = await serviceClient
        .from("course_maintainers")
        .insert({
          course_id: course.id,
          user_id: TEST_USERS.user1.id,
        });

      if (maintainerError) throw maintainerError;
    }

    // Create a course where user2 is a maintainer
    const user2CourseData = generateTestData();
    const { data: user2Course, error: user2CourseError } = await serviceClient
      .from("courses")
      .insert({
        name: user2CourseData.title,
        bucket_id: testBucketId,
        description: "User2's maintained course",
      })
      .select()
      .single();

    if (user2CourseError) throw user2CourseError;

    testCourseIds.push(user2Course.id);

    // Add user2 as a course maintainer
    const { error: user2MaintainerError } = await serviceClient
      .from("course_maintainers")
      .insert({
        course_id: user2Course.id,
        user_id: TEST_USERS.user2.id,
      });

    if (user2MaintainerError) throw user2MaintainerError;
  });

  afterAll(async () => {
    // Clean up test data
    if (testCourseIds.length > 0) {
      // First remove course maintainer relationships
      for (const courseId of testCourseIds) {
        await serviceClient
          .from("course_maintainers")
          .delete()
          .eq("course_id", courseId);
      }
      // Then delete the courses
      await serviceClient.from("courses").delete().in("id", testCourseIds);
    }
    if (testBucketId) {
      await serviceClient.from("buckets").delete().eq("id", testBucketId);
    }
  });

  it("should allow a user to retrieve courses they maintain", async () => {
    const { data, error } = await user1Client.rpc("get_maintained_courses");

    if (error) throw error;

    expect(data.length).toBeGreaterThan(0);

    // Verify user1 can see their maintained courses
    const user1Courses = testCourseIds.slice(0, 3);
    user1Courses.forEach((testCourseId) => {
      const testCourse = data.find((course) => course.id === testCourseId);
      expect(testCourse).toBeDefined();
      if (testCourse) {
        expect(testCourse.bucket_id).toBe(testBucketId);
        expect(testCourse).toHaveProperty("description");
        expect(testCourse).toHaveProperty("created_at");
      }
    });

    // Verify user1 cannot see user2's maintained course
    const user2CourseId = testCourseIds[3];
    const user2Course = data.find((course) => course.id === user2CourseId);
    expect(user2Course).toBeUndefined();
  });

  it("should respect pagination parameters", async () => {
    // Test with a specific page size
    const { data: singlePageData, error: singlePageError } =
      await user1Client.rpc("get_maintained_courses", {
        page_number: 0,
        items_per_page: 1,
      });

    if (singlePageError) throw singlePageError;

    expect(singlePageData.length).toBeLessThanOrEqual(1);

    // Test with second page
    const { data: secondPageData, error: secondPageError } =
      await user1Client.rpc("get_maintained_courses", {
        page_number: 1,
        items_per_page: 1,
      });

    if (secondPageError) throw secondPageError;

    if (singlePageData.length > 0 && secondPageData.length > 0) {
      // Ensure different courses are returned on different pages
      expect(singlePageData[0].id).not.toBe(secondPageData[0].id);
    }
  });

  it("should let user2 only see their maintained courses", async () => {
    const { data, error } = await user2Client.rpc("get_maintained_courses");

    if (error) throw error;

    // User2 should only see the one course they maintain
    expect(data.length).toBe(1);
    if (data.length > 0) {
      expect(data[0].id).toBe(testCourseIds[3]); // The last course that was created
    }
  });

  it("should not allow unauthenticated access", async () => {
    const { data, error } = await anonymousClient.rpc("get_maintained_courses");

    if (error) throw error;

    expect(data.length).toBe(0);
  });
});
