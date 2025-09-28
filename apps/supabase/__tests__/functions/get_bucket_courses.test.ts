import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("get_bucket_courses function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let user2Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let testBucketId: string;
  let testCourseIds: string[] = [];

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

  it("should allow the bucket owner to retrieve courses", async () => {
    const { data, error } = await user1Client.rpc("get_bucket_courses", {
      p_bucket_id: testBucketId,
    });

    if (error) throw error;

    expect(data.length).toBeGreaterThan(0);

    // Verify our test courses are in the results
    testCourseIds.forEach((testCourseId) => {
      const testCourse = data.find((course) => course.id === testCourseId);
      expect(testCourse).toBeDefined();
    });
  });

  it("should respect pagination parameters", async () => {
    // Test with a specific page size
    const { data: singlePageData, error: singlePageError } =
      await user1Client.rpc("get_bucket_courses", {
        p_bucket_id: testBucketId,
        page_number: 0,
        items_per_page: 1,
      });

    if (singlePageError) throw singlePageError;

    expect(singlePageData.length).toBeLessThanOrEqual(1);
  });

  it("should not allow unauthorized users to access bucket courses", async () => {
    // User2 should not be able to access User1's bucket courses
    const { data, error } = await user2Client.rpc("get_bucket_courses", {
      p_bucket_id: testBucketId,
    });

    if (error) throw error;

    expect(
      data.find((course) => course.id === testCourseIds[0])
    ).toBeUndefined();
  });

  it("should not allow unauthenticated access", async () => {
    const { data, error } = await anonymousClient.rpc("get_bucket_courses", {
      p_bucket_id: testBucketId,
    });

    if (error) throw error;

    expect(data.length).toBe(0);
  });
});
