import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("ilike_bucket_courses function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let user2Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let testBucketId: string;
  let testCourseIds: string[] = [];
  let courseNames: string[] = [];

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

    // Create test courses with specific prefixes in the bucket
    const prefixedCourseNames = [
      "Alpha Course",
      "Alpha Advanced",
      "Beta Introduction",
      "Gamma Basics",
      "Delta Framework",
    ];

    for (const courseName of prefixedCourseNames) {
      const { data: course, error: courseError } = await serviceClient
        .from("courses")
        .insert({
          name: courseName,
          bucket_id: testBucketId,
          description: "Test course description",
        })
        .select()
        .single();

      if (courseError) throw courseError;

      testCourseIds.push(course.id);
      courseNames.push(courseName);
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (testCourseIds.length > 0) {
      await serviceClient.from("courses").delete().in("id", testCourseIds);
    }
    if (testBucketId) {
      await serviceClient.from("buckets").delete().eq("id", testBucketId);
    }
  });

  it("should filter courses by prefix for the bucket owner", async () => {
    const { data, error } = await user1Client.rpc("ilike_bucket_courses", {
      p_bucket_id: testBucketId,
      prefix: "Alpha",
    });

    if (error) throw error;

    expect(data.length).toBe(2);
    expect(data.every((course) => course.name.startsWith("Alpha"))).toBe(true);
  });

  it("should return empty results for non-matching prefixes", async () => {
    const { data, error } = await user1Client.rpc("ilike_bucket_courses", {
      p_bucket_id: testBucketId,
      prefix: "Zeta",
    });

    if (error) throw error;

    expect(data.length).toBe(0);
  });

  it("should be case insensitive", async () => {
    const { data, error } = await user1Client.rpc("ilike_bucket_courses", {
      p_bucket_id: testBucketId,
      prefix: "alpha",
    });

    if (error) throw error;

    expect(data.length).toBe(2);
    // Check if returned courses contain "Alpha" in their name (case insensitive)
    expect(
      data.every((course) => course.name.toLowerCase().startsWith("alpha"))
    ).toBe(true);
  });

  it("should not allow unauthorized users to access bucket courses", async () => {
    // User2 should not be able to access User1's bucket courses
    const { data, error } = await user2Client.rpc("ilike_bucket_courses", {
      p_bucket_id: testBucketId,
      prefix: "Alpha",
    });

    if (error) throw error;

    expect(data.length).toBe(0);
  });

  it("should not allow unauthenticated access", async () => {
    const { data, error } = await anonymousClient.rpc("ilike_bucket_courses", {
      p_bucket_id: testBucketId,
      prefix: "Alpha",
    });

    if (error) throw error;

    expect(data.length).toBe(0);
  });

  it("should respect the limit of 5 results", async () => {
    // This test assumes there are already 5 or more courses in the test bucket
    const { data, error } = await user1Client.rpc("ilike_bucket_courses", {
      p_bucket_id: testBucketId,
      prefix: "", // Empty prefix should match all courses
    });

    if (error) throw error;

    expect(data.length).toBeLessThanOrEqual(5);
  });
});
