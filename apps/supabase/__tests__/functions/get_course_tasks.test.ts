import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("get_course_tasks function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let user2Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let testBucketId: string;
  let testCourseId: string;
  let testTaskIds: string[] = [];

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
        description: "Test course for tasks",
      })
      .select()
      .single();

    if (courseError) throw courseError;

    testCourseId = course.id;

    // Add the owner as a course maintainer
    const { error: courseUserError } = await serviceClient
      .from("course_maintainers")
      .insert({
        course_id: testCourseId,
        user_id: TEST_USERS.user1.id,
      });

    if (courseUserError) throw courseUserError;

    // Create multiple test tasks for the course
    for (let i = 0; i < 5; i++) {
      const taskData = generateTestData();
      const { data: task, error: taskError } = await serviceClient
        .from("tasks")
        .insert({
          course_id: testCourseId,
          file_size: 1024 * 1024,
          name: taskData.title,
          status: i % 2 === 0 ? "finished" : "processing",
        })
        .select()
        .single();

      if (taskError) throw taskError;

      testTaskIds.push(task.id);
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (testTaskIds.length > 0) {
      await serviceClient.from("tasks").delete().in("id", testTaskIds);
    }
    if (testCourseId) {
      await serviceClient.from("courses").delete().eq("id", testCourseId);
    }
    if (testBucketId) {
      await serviceClient.from("buckets").delete().eq("id", testBucketId);
    }
  });

  it("should allow the bucket owner to retrieve course tasks", async () => {
    const { data, error } = await user1Client.rpc("get_course_tasks", {
      p_course_id: testCourseId,
    });

    if (error) throw error;

    expect(data.length).toBeGreaterThan(0);

    // Verify our test tasks are in the results
    testTaskIds.forEach((testTaskId) => {
      const testTask = data.find((task) => task.id === testTaskId);
      expect(testTask).toBeDefined();
      expect(testTask!.course_id).toBe(testCourseId);
    });
  });

  it("should respect pagination parameters", async () => {
    // Test with a specific page size
    const { data: singlePageData, error: singlePageError } =
      await user1Client.rpc("get_course_tasks", {
        p_course_id: testCourseId,
        page_number: 0,
        items_per_page: 2,
      });

    if (singlePageError) throw singlePageError;

    expect(singlePageData.length).toBeLessThanOrEqual(2);

    // Test with another page
    const { data: secondPageData, error: secondPageError } =
      await user1Client.rpc("get_course_tasks", {
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

  it("should not allow unauthorized users to access course tasks", async () => {
    // User2 should not be able to access User1's course tasks
    const { data, error } = await user2Client.rpc("get_course_tasks", {
      p_course_id: testCourseId,
    });

    if (error) throw error;

    expect(data.find((task) => task.id === testTaskIds[0])).toBeUndefined();
  });

  it("should not allow unauthenticated access", async () => {
    const { data, error } = await anonymousClient.rpc("get_course_tasks", {
      p_course_id: testCourseId,
    });

    if (error) throw error;

    expect(data.length).toBe(0);
  });

  it("should include all required task properties in results", async () => {
    const { data, error } = await user1Client.rpc("get_course_tasks", {
      p_course_id: testCourseId,
      items_per_page: 1,
    });

    if (error) throw error;

    if (data.length > 0) {
      const task = data[0];
      expect(task).toHaveProperty("id");
      expect(task).toHaveProperty("course_id");
      expect(task).toHaveProperty("name");
      expect(task).toHaveProperty("status");
      expect(task).toHaveProperty("created_at");
      expect(task).toHaveProperty("pub_date");
    }
  });
});
