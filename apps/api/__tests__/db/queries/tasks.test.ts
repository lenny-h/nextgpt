import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  addTask,
  deleteTask,
  getTaskDetails,
} from "../../../src/lib/db/queries/tasks.js";
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

describe("tasks.ts query tests", async () => {
  const testBuckets: { id: string }[] = [];
  const testCourses: { id: string }[] = [];
  const testTasks: { id: string }[] = [];

  const testUserId1 = TEST_USERS.user1.id;

  let testBucketId: string;
  let testCourseId: string;
  let testTaskId: string;
  let testTaskName: string;

  const supabase = createServiceClient();

  beforeAll(async () => {
    // Create a test bucket
    const bucketData = generateTestData();
    testBucketId = bucketData.uuid;

    const { error: bucketError } = await supabase.from("buckets").insert({
      id: testBucketId,
      owner: testUserId1,
      name: bucketData.title,
      max_size: 1024 * 1024 * 1024, // 1GB
      size: 0,
      type: "small",
    });

    if (bucketError) {
      throw bucketError;
    }

    testBuckets.push({ id: testBucketId });

    // Create a test course
    const courseData = generateTestData();
    testCourseId = courseData.uuid;

    const { error: courseError } = await supabase.from("courses").insert({
      id: testCourseId,
      name: courseData.title,
      description: "Test course description",
      bucket_id: testBucketId,
    });

    if (courseError) {
      throw courseError;
    }

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
  });

  afterAll(async () => {
    // Clean up test data
    for (const task of testTasks) {
      await cleanupTestData(supabase, "tasks", "id", task.id);
    }

    for (const course of testCourses) {
      await cleanupTestData(supabase, "courses", "id", course.id);
    }

    for (const bucket of testBuckets) {
      await cleanupTestData(supabase, "buckets", "id", bucket.id);
    }
  });

  it("should add a task", async () => {
    // Arrange
    const taskData = generateTestData();
    testTaskId = taskData.uuid;
    testTaskName = taskData.title;
    const testFileSize = 1024 * 1024; // 1MB

    // Act
    await addTask({
      id: testTaskId,
      courseId: testCourseId,
      filename: testTaskName,
      fileSize: testFileSize,
      pubDate: new Date(),
    });

    // Assert
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select()
      .eq("id", testTaskId);

    if (error) {
      throw error;
    }

    expect(tasks.length).toBe(1);
    expect(tasks[0].course_id).toBe(testCourseId);
    expect(tasks[0].name).toBe(testTaskName);

    testTasks.push({ id: testTaskId });

    // Verify bucket size was updated
    const { data: bucket, error: bucketError } = await supabase
      .from("buckets")
      .select("size")
      .eq("id", testBucketId)
      .single();

    if (bucketError) {
      throw bucketError;
    }

    expect(bucket.size).toBe(testFileSize);
  });

  it("should get task details", async () => {
    // Act
    const details = await getTaskDetails({ taskId: testTaskId });

    // Assert
    expect(details.courseId).toBe(testCourseId);
    expect(details.name).toBe(testTaskName);
    expect(details.status).toBeDefined();
  });

  it("should delete a task", async () => {
    // Act
    await deleteTask({ taskId: testTaskId });

    // Assert
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select()
      .eq("id", testTaskId);

    if (error) {
      throw error;
    }

    expect(tasks.length).toBe(0);

    // Remove from tracking array
    const index = testTasks.findIndex((t) => t.id === testTaskId);
    if (index !== -1) {
      testTasks.splice(index, 1);
    }
  });
});
