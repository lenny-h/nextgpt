import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData, generateUUID } from "../test-utils.js";

describe("get_random_pages function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let testBucketId: string;
  let testCourseId: string;
  let testFileId1: string;
  let testFileId2: string;
  let testPageIds: string[] = [];

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
        description: "Test course for random pages",
      })
      .select()
      .single();

    if (courseError) throw courseError;

    testCourseId = course.id;

    // Create two test files
    const fileData1 = generateTestData();
    const { data: file1, error: fileError1 } = await serviceClient
      .from("files")
      .insert({
        course_id: testCourseId,
        name: fileData1.title,
        size: 1024,
      })
      .select()
      .single();

    if (fileError1) throw fileError1;

    testFileId1 = file1.id;

    const fileData2 = generateTestData();
    const { data: file2, error: fileError2 } = await serviceClient
      .from("files")
      .insert({
        course_id: testCourseId,
        name: fileData2.title,
        size: 2048,
      })
      .select()
      .single();

    if (fileError2) throw fileError2;

    testFileId2 = file2.id;

    // Create test pages for both files
    for (let i = 0; i < 8; i++) {
      const fileId = i < 4 ? testFileId1 : testFileId2;
      const fileName = i < 4 ? file1.name : file2.name;
      const embedding = Array(768)
        .fill(0)
        .map(() => Math.random() * 2 - 1);

      const { data: page, error: pageError } = await serviceClient
        .from("pages")
        .insert({
          id: generateUUID(),
          file_id: fileId,
          file_name: fileName,
          course_id: testCourseId,
          course_name: course.name,
          embedding: JSON.stringify(embedding),
          content: `Test content for page ${i + 1}`,
          page_index: i % 4,
          page_number: (i % 4) + 1,
          chapter: Math.floor(i / 2) + 1,
          sub_chapter: 1,
        })
        .select()
        .single();

      if (pageError) throw pageError;

      testPageIds.push(page.id);
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (testPageIds.length > 0) {
      for (const pageId of testPageIds) {
        await serviceClient.from("pages").delete().eq("id", pageId);
      }
    }
    if (testFileId1) {
      await serviceClient.from("files").delete().eq("id", testFileId1);
    }
    if (testFileId2) {
      await serviceClient.from("files").delete().eq("id", testFileId2);
    }
    if (testCourseId) {
      await serviceClient.from("courses").delete().eq("id", testCourseId);
    }
    if (testBucketId) {
      await serviceClient.from("buckets").delete().eq("id", testBucketId);
    }
  });

  it("should return random pages from the specified files when called by service client", async () => {
    const fileIds = [testFileId1, testFileId2];

    const { data, error } = await serviceClient.rpc("get_random_pages", {
      p_file_ids: fileIds,
    });

    if (error) throw error;

    // The function should return at most 4 pages
    expect(data.length).toBeGreaterThan(0);
    expect(data.length).toBeLessThanOrEqual(4);

    // All returned pages should be from the requested files
    data.forEach((page) => {
      expect(fileIds).toContain(page.file_id);
    });
  });

  it("should return pages for a single file when called by service client", async () => {
    const fileIds = [testFileId1];

    const { data, error } = await serviceClient.rpc("get_random_pages", {
      p_file_ids: fileIds,
    });

    if (error) throw error;

    // All returned pages should be from file1 only
    data.forEach((page) => {
      expect(page.file_id).toBe(testFileId1);
    });
  });

  it("should return empty result for non-existent files when called by service client", async () => {
    const nonExistentFileId = "00000000-0000-0000-0000-000000000000";

    const { data, error } = await serviceClient.rpc("get_random_pages", {
      p_file_ids: [nonExistentFileId],
    });

    if (error) throw error;

    expect(data.length).toBe(0);
  });

  it("should not allow regular users to call the function", async () => {
    const fileIds = [testFileId1, testFileId2];

    const { data, error } = await user1Client.rpc("get_random_pages", {
      p_file_ids: fileIds,
    });

    if (error) throw error;

    expect(data.length).toBe(0);
  });

  it("should not allow unauthenticated access", async () => {
    const { data, error } = await anonymousClient.rpc("get_random_pages", {
      p_file_ids: [testFileId1, testFileId2],
    });

    if (error) throw error;

    expect(data.length).toBe(0);
  });

  it("should include all required page properties in results when called by service client", async () => {
    const { data, error } = await serviceClient.rpc("get_random_pages", {
      p_file_ids: [testFileId1],
    });

    if (error) throw error;

    expect(data.length).toBeGreaterThan(0);

    const page = data[0];
    expect(page).toHaveProperty("id");
    expect(page).toHaveProperty("file_id");
    expect(page).toHaveProperty("file_name");
    expect(page).toHaveProperty("course_id");
    expect(page).toHaveProperty("course_name");
    expect(page).toHaveProperty("page_index");
  });
});
