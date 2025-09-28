import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData, generateUUID } from "../test-utils.js";

describe("match_documents function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let testBucketId: string;
  let testCourseId: string;
  let testFileId: string;
  let testPageIds: string[] = [];

  const createTestEmbedding = (startValue: number, length = 768) => {
    const embedding = Array.from({ length }, (_, i) => startValue + i * 0.001);

    return JSON.stringify(embedding);
  };

  const queryEmbedding = createTestEmbedding(0.1);

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

    // Create a test course
    const courseData = generateTestData();
    const { data: course, error: courseError } = await serviceClient
      .from("courses")
      .insert({
        name: courseData.title,
        bucket_id: testBucketId,
        description: "Test course for document matching",
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

    // Create test pages with varying similarity to the query embedding
    for (let i = 0; i < 6; i++) {
      // Create embeddings with varying similarity to the query
      // Lower numbers will be more similar to the query embedding
      const similarity = i * 0.1;
      const pageEmbedding = createTestEmbedding(similarity);

      const { data: page, error: pageError } = await serviceClient
        .from("pages")
        .insert({
          id: generateUUID(),
          file_id: testFileId,
          file_name: file.name,
          course_id: testCourseId,
          course_name: course.name,
          embedding: pageEmbedding,
          content: `Test content for page ${i + 1}`,
          page_index: i,
          page_number: i + 1,
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

  it("should match documents by file ID", async () => {
    // Should fail for regular users
    const { data: userData, error: userError } = await user1Client.rpc(
      "match_documents",
      {
        query_embedding: queryEmbedding,
        file_ids: [testFileId],
        match_threshold: 0.5,
        match_count: 3,
      }
    );

    if (userError) throw userError;

    expect(userData.length).toBe(0);

    // Should succeed for service client
    const { data, error } = await serviceClient.rpc("match_documents", {
      query_embedding: queryEmbedding,
      file_ids: [testFileId],
      match_threshold: 0.5,
      match_count: 3,
    });

    if (error) throw error;

    expect(data.length).toBeGreaterThan(0);
    expect(data.length).toBeLessThanOrEqual(3);

    // All results should be from the specified file
    data.forEach((result) => {
      expect(result.file_id).toBe(testFileId);
      expect(result.course_id).toBe(testCourseId);
      expect(result).toHaveProperty("similarity");
      expect(result.similarity).toBeGreaterThan(0.5);
    });

    // Results should be ordered by descending similarity
    for (let i = 1; i < data.length; i++) {
      expect(data[i - 1].similarity).toBeGreaterThanOrEqual(data[i].similarity);
    }
  });

  it("should match documents by course ID", async () => {
    // Should fail for regular users
    const { data: userData, error: userError } = await user1Client.rpc(
      "match_documents",
      {
        query_embedding: queryEmbedding,
        course_ids: [testCourseId],
        match_threshold: 0.5,
        match_count: 3,
      }
    );

    if (userError) throw userError;

    expect(userData.length).toBe(0);

    // Should succeed for service client
    const { data, error } = await serviceClient.rpc("match_documents", {
      query_embedding: queryEmbedding,
      course_ids: [testCourseId],
      match_threshold: 0.5,
      match_count: 3,
    });

    if (error) throw error;

    expect(data.length).toBeGreaterThan(0);

    // All results should be from the specified course
    data.forEach((result) => {
      expect(result.course_id).toBe(testCourseId);
    });
  });

  it("should respect match_threshold parameter", async () => {
    const highThreshold = 0.9;

    const { data, error } = await serviceClient.rpc("match_documents", {
      query_embedding: queryEmbedding,
      file_ids: [testFileId],
      match_threshold: highThreshold,
    });

    if (error) throw error;

    // Each result should have similarity above the high threshold
    data.forEach((result) => {
      expect(result.similarity).toBeGreaterThan(highThreshold);
    });
  });

  it("should respect match_count parameter", async () => {
    const smallCount = 2;

    const { data, error } = await serviceClient.rpc("match_documents", {
      query_embedding: queryEmbedding,
      file_ids: [testFileId],
      match_count: smallCount,
    });

    if (error) throw error;

    expect(data.length).toBeLessThanOrEqual(smallCount);
  });

  it("should retrieve content when requested", async () => {
    const { data: withoutContent, error: withoutContentError } =
      await serviceClient.rpc("match_documents", {
        query_embedding: queryEmbedding,
        file_ids: [testFileId],
        retrieve_content: false,
      });

    if (withoutContentError) throw withoutContentError;

    expect(withoutContent[0].content).toBeNull();

    const { data: withContent, error: withContentError } =
      await serviceClient.rpc("match_documents", {
        query_embedding: queryEmbedding,
        file_ids: [testFileId],
        retrieve_content: true,
      });

    if (withContentError) throw withContentError;

    expect(withContent[0].content).not.toBeNull();
    expect(withContent[0].content).toMatch(/Test content for page/);
  });

  it("should return an error if neither file_ids nor course_ids are provided", async () => {
    const { error } = await serviceClient.rpc("match_documents", {
      query_embedding: queryEmbedding,
    });

    expect(error).not.toBeNull();
    expect(error?.message).toContain("file_ids or course_ids must be provided");
  });

  it("should not allow regular authenticated users", async () => {
    const { data, error } = await user1Client.rpc("match_documents", {
      query_embedding: queryEmbedding,
      file_ids: [testFileId],
    });

    if (error) throw error;

    expect(data.length).toBe(0);
  });

  it("should not allow unauthenticated access", async () => {
    const { data, error } = await anonymousClient.rpc("match_documents", {
      query_embedding: queryEmbedding,
      file_ids: [testFileId],
    });

    if (error) throw error;

    expect(data.length).toBe(0);
  });
});
