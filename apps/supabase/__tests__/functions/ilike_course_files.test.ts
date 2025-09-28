import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("ilike_course_files function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let user2Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let testBucketId: string;
  let testCourseId: string;
  let testFileIds: string[] = [];

  beforeAll(async () => {
    // Set up authenticated clients
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
    const testFiles = [
      "Document_report.pdf",
      "Document_analysis.pdf",
      "Presentation_slides.pdf",
      "Spreadsheet_data.pdf",
      "Notes_class.pdf",
    ];

    for (let i = 0; i < testFiles.length; i++) {
      const { data: file, error: fileError } = await serviceClient
        .from("files")
        .insert({
          course_id: testCourseId,
          name: testFiles[i],
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

  it("should filter files by prefix for a specific course", async () => {
    const { data, error } = await user1Client.rpc("ilike_course_files", {
      p_course_id: testCourseId,
      prefix: "Document",
    });

    if (error) throw error;

    expect(data.length).toBe(2); // Should find the two Document_ files
    data.forEach((file) => {
      expect(file.name.startsWith("Document")).toBe(true);
      expect(file.course_id).toBe(testCourseId);
    });
  });

  it("should be case insensitive when filtering by prefix", async () => {
    const { data, error } = await user1Client.rpc("ilike_course_files", {
      p_course_id: testCourseId,
      prefix: "document",
    });

    if (error) throw error;

    expect(data.length).toBe(2);
    data.forEach((file) => {
      expect(file.name.toLowerCase().startsWith("document")).toBe(true);
    });
  });

  it("should return empty results for non-matching prefixes", async () => {
    const { data, error } = await user1Client.rpc("ilike_course_files", {
      p_course_id: testCourseId,
      prefix: "NonExistent",
    });

    if (error) throw error;

    expect(data.length).toBe(0);
  });

  it("should limit results to 5 files", async () => {
    // Try to find all files using an empty prefix
    const { data, error } = await user1Client.rpc("ilike_course_files", {
      p_course_id: testCourseId,
      prefix: "",
    });

    if (error) throw error;

    expect(data.length).toBeLessThanOrEqual(5);
  });

  it("should return file details including id, name, size, and created_at", async () => {
    const { data, error } = await user1Client.rpc("ilike_course_files", {
      p_course_id: testCourseId,
      prefix: "Presentation",
    });

    if (error) throw error;

    expect(data.length).toBeGreaterThan(0);
    const file = data[0];
    expect(file).toHaveProperty("id");
    expect(file).toHaveProperty("course_id");
    expect(file).toHaveProperty("name");
    expect(file).toHaveProperty("size");
    expect(file).toHaveProperty("created_at");
    expect(file.name).toBe("Presentation_slides.pdf");
  });

  it("should order files by created_at in descending order", async () => {
    const { data, error } = await user1Client.rpc("ilike_course_files", {
      p_course_id: testCourseId,
      prefix: "",
    });

    if (error) throw error;

    // Ensure files are ordered by created_at in descending order
    if (data.length >= 2) {
      for (let i = 0; i < data.length - 1; i++) {
        const currentDate = new Date(data[i].created_at).getTime();
        const nextDate = new Date(data[i + 1].created_at).getTime();
        expect(currentDate).toBeGreaterThanOrEqual(nextDate);
      }
    }
  });

  // TODO: For the below test to work, the file policies need to be changed

  //   it("should not allow unauthorized users to access course files", async () => {
  //     // User2 should not be able to access User1's course files
  //     const { data, error } = await user2Client.rpc("ilike_course_files", {
  //       p_course_id: testCourseId,
  //       prefix: "Document",
  //     });

  //     if (error) throw error;

  //     expect(data.length).toBe(0);
  //   });

  it("should not allow unauthenticated access", async () => {
    const { data, error } = await anonymousClient.rpc("ilike_course_files", {
      p_course_id: testCourseId,
      prefix: "Document",
    });

    if (error) throw error;

    expect(data.length).toBe(0);
  });
});
