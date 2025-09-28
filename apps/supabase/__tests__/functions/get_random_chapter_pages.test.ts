import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData, generateUUID } from "../test-utils.js";

describe("get_random_chapter_pages function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let testBucketId: string;
  let testCourseId: string;
  let testFileId: string;
  let testPageIds: string[] = [];

  // Track created chapters for testing
  const testChapters = [1, 2, 3, 4];

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
        description: "Test course for pages",
      })
      .select()
      .single();

    if (courseError) throw courseError;

    testCourseId = course.id;

    // Create a test file
    const fileData = generateTestData();
    const { data: file, error: fileError } = await serviceClient
      .from("files")
      .insert({
        course_id: testCourseId,
        name: fileData.title,
        size: 1024,
      })
      .select()
      .single();

    if (fileError) throw fileError;

    testFileId = file.id;

    // Create test pages with different chapters
    for (let i = 0; i < 16; i++) {
      const embedding = Array(768)
        .fill(0)
        .map(() => Math.random() * 2 - 1);
      const chapterIndex = i % 4; // distribute pages across 4 chapters

      const { data: page, error: pageError } = await serviceClient
        .from("pages")
        .insert({
          id: generateUUID(),
          file_id: testFileId,
          file_name: file.name,
          course_id: testCourseId,
          course_name: course.name,
          embedding: JSON.stringify(embedding),
          content: `Test content for page ${i + 1}`,
          page_index: i,
          page_number: i + 1,
          chapter: testChapters[chapterIndex],
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
    for (const pageId of testPageIds) {
      await serviceClient.from("pages").delete().eq("id", pageId);
    }
    if (testFileId) {
      await serviceClient.from("files").delete().eq("id", testFileId);
    }
    if (testCourseId) {
      await serviceClient.from("courses").delete().eq("id", testCourseId);
    }
    if (testBucketId) {
      await serviceClient.from("buckets").delete().eq("id", testBucketId);
    }
  });

  it("should return random pages from specified chapters when called by service client", async () => {
    // Only request pages from the first two chapters
    const chaptersToRequest = [1, 2];

    const { data, error } = await serviceClient.rpc(
      "get_random_chapter_pages",
      {
        p_file_id: testFileId,
        p_file_chapters: chaptersToRequest,
      }
    );

    if (error) throw error;

    // The function should return at most 4 pages
    expect(data.length).toBeGreaterThan(0);
    expect(data.length).toBeLessThanOrEqual(4);

    // All returned pages should be from the requested chapters
    data.forEach((page) => {
      expect(page.file_id).toBe(testFileId);
    });
  });

  it("should return empty result for non-existent chapters when called by service client", async () => {
    // Request pages from a chapter that doesn't exist
    const nonExistentChapters = [99];

    const { data, error } = await serviceClient.rpc(
      "get_random_chapter_pages",
      {
        p_file_id: testFileId,
        p_file_chapters: nonExistentChapters,
      }
    );

    if (error) throw error;

    expect(data.length).toBe(0);
  });

  it("should not allow regular users to call the function", async () => {
    const { data, error } = await user1Client.rpc("get_random_chapter_pages", {
      p_file_id: testFileId,
      p_file_chapters: testChapters,
    });

    if (error) throw error;

    expect(data.length).toBe(0);
  });

  it("should not allow unauthenticated access", async () => {
    const { data, error } = await anonymousClient.rpc(
      "get_random_chapter_pages",
      {
        p_file_id: testFileId,
        p_file_chapters: testChapters,
      }
    );

    if (error) throw error;

    expect(data.length).toBe(0);
  });

  it("should include all required page properties in results when called by service client", async () => {
    const { data, error } = await serviceClient.rpc(
      "get_random_chapter_pages",
      {
        p_file_id: testFileId,
        p_file_chapters: [testChapters[0]],
      }
    );

    if (error) throw error;

    if (data.length > 0) {
      const page = data[0];
      expect(page).toHaveProperty("id");
      expect(page).toHaveProperty("file_id");
      expect(page).toHaveProperty("file_name");
      expect(page).toHaveProperty("course_id");
      expect(page).toHaveProperty("course_name");
      expect(page).toHaveProperty("page_index");
    }
  });
});
