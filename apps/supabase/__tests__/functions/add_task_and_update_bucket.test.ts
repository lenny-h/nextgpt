import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("add_task_and_update_bucket function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let testBucketId: string;
  let testCourseId: string;
  let testTaskId: string;

  beforeAll(async () => {
    user1Client = await signInUser(
      TEST_USERS.user1.email,
      TEST_USERS.user1.password
    );
    anonymousClient = createUnauthenticatedClient();
    serviceClient = createServiceClient();

    // Create a test bucket
    const bucketTestData = generateTestData();
    const { data: bucketData, error: bucketError } = await serviceClient
      .from("buckets")
      .insert({
        owner: TEST_USERS.user1.id,
        name: bucketTestData.title,
        max_size: 100 * 1024 * 1024,
        type: "small",
        users_count: 1,
      })
      .select()
      .single();

    if (bucketError) throw bucketError;

    testBucketId = bucketData.id;

    // Add user to bucket_users
    const { error: bucketUserError } = await serviceClient
      .from("bucket_users")
      .insert({
        bucket_id: testBucketId,
        user_id: TEST_USERS.user1.id,
      });

    if (bucketUserError) throw bucketUserError;

    // Create a test course
    const courseTestData = generateTestData();
    const { data: courseData, error: courseError } = await serviceClient
      .from("courses")
      .insert({
        name: courseTestData.title,
        bucket_id: testBucketId,
        description: "Test course description",
      })
      .select()
      .single();

    if (courseError) throw courseError;
    testCourseId = courseData.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testTaskId) {
      await serviceClient.from("tasks").delete().eq("id", testTaskId);
    }
    if (testCourseId) {
      await serviceClient.from("courses").delete().eq("id", testCourseId);
    }
    if (testBucketId) {
      await serviceClient
        .from("bucket_users")
        .delete()
        .eq("bucket_id", testBucketId);
      await serviceClient.from("buckets").delete().eq("id", testBucketId);
    }
  });

  it("should add a task and update the bucket size", async () => {
    const taskTestData = generateTestData();
    const taskId = taskTestData.uuid;
    const taskName = taskTestData.title;
    const fileSize = 1024 * 1024;

    // Get initial bucket size
    const { data: initialBucket, error: initialError } = await serviceClient
      .from("buckets")
      .select("size")
      .eq("id", testBucketId)
      .single();

    if (initialError) throw initialError;
    const initialSize = initialBucket.size;

    // Add task and update bucket
    const { error } = await serviceClient.rpc("add_task_and_update_bucket", {
      p_id: taskId,
      p_course_id: testCourseId,
      p_name: taskName,
      p_file_size: fileSize,
      p_pub_date: new Date().toISOString(),
    });

    if (error) throw error;
    testTaskId = taskId;

    // Verify task was created
    const { data: taskData, error: taskError } = await serviceClient
      .from("tasks")
      .select()
      .eq("id", testTaskId)
      .single();

    if (taskError) throw taskError;

    expect(taskData.name).toBe(taskName);
    expect(taskData.course_id).toBe(testCourseId);

    // Verify bucket size was updated
    const { data: updatedBucket, error: updatedError } = await serviceClient
      .from("buckets")
      .select("size")
      .eq("id", testBucketId)
      .single();

    if (updatedError) throw updatedError;

    expect(updatedBucket.size).toBe(initialSize + fileSize);
  });

  it("should not allow unauthorized users to add tasks", async () => {
    const taskTestData = generateTestData();
    const taskId = taskTestData.uuid;
    const taskName = taskTestData.title;
    const fileSize = 1024 * 1024;

    // User1 tries to add a task
    const { error } = await user1Client.rpc("add_task_and_update_bucket", {
      p_id: taskId,
      p_course_id: testCourseId,
      p_name: taskName,
      p_file_size: fileSize,
      p_pub_date: new Date().toISOString(),
    });

    expect(error).not.toBeNull();
    expect(error?.message).toContain("violates row-level security policy");
  });

  it("should not allow unauthenticated users to add tasks", async () => {
    const taskTestData = generateTestData();
    const taskId = taskTestData.uuid;
    const taskName = taskTestData.title;
    const fileSize = 1024 * 1024;

    // Anonymous user tries to add a task
    const { error } = await anonymousClient.rpc("add_task_and_update_bucket", {
      p_id: taskId,
      p_course_id: testCourseId,
      p_name: taskName,
      p_file_size: fileSize,
      p_pub_date: new Date().toISOString(),
    });

    expect(error).not.toBeNull();
    expect(error?.message).toContain("not found"); // When an anonymous user runs the rpc, it should not find the course, since the course belongs to user1
  });
});
