import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("get_course_maintainers function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let user2Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let testBucketId: string;
  let testCourseId: string;

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

    // Create a test course in the bucket
    const courseData = generateTestData();
    const { data: course, error: courseError } = await serviceClient
      .from("courses")
      .insert({
        name: courseData.title,
        bucket_id: testBucketId,
        description: "Test course description",
      })
      .select()
      .single();

    if (courseError) throw courseError;

    testCourseId = course.id;

    // Add user1 and user2 as course maintainers
    const { error: maintainerError } = await serviceClient
      .from("course_maintainers")
      .insert([
        {
          course_id: testCourseId,
          user_id: TEST_USERS.user1.id,
        },
        {
          course_id: testCourseId,
          user_id: TEST_USERS.user2.id,
        },
      ]);

    if (maintainerError) throw maintainerError;
  });

  afterAll(async () => {
    // Clean up test data
    if (testCourseId) {
      await serviceClient
        .from("course_maintainers")
        .delete()
        .eq("course_id", testCourseId);
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

  it("should allow course maintainers to retrieve all maintainers", async () => {
    const { data, error } = await user1Client.rpc("get_course_maintainers", {
      p_course_id: testCourseId,
    });

    if (error) throw error;

    expect(data.length).toBeGreaterThanOrEqual(2);

    // Verify both test users are in the results
    const user1Maintainer = data.find((m) => m.id === TEST_USERS.user1.id);
    const user2Maintainer = data.find((m) => m.id === TEST_USERS.user2.id);

    expect(user1Maintainer).toBeDefined();
    expect(user2Maintainer).toBeDefined();
  });

  it("should allow any maintainer to retrieve the maintainer list", async () => {
    // User2 is also a maintainer and should be able to get the list
    const { data, error } = await user2Client.rpc("get_course_maintainers", {
      p_course_id: testCourseId,
    });

    if (error) throw error;

    expect(data.length).toBeGreaterThanOrEqual(2);
    expect(data.find((m) => m.id === TEST_USERS.user1.id)).toBeDefined();
    expect(data.find((m) => m.id === TEST_USERS.user2.id)).toBeDefined();
  });

  it("should not allow unauthenticated access", async () => {
    const { data, error } = await anonymousClient.rpc(
      "get_course_maintainers",
      {
        p_course_id: testCourseId,
      }
    );

    if (error) throw error;

    expect(data.length).toBe(0);
  });

  it("should return empty result for non-existent course", async () => {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const { data, error } = await user1Client.rpc("get_course_maintainers", {
      p_course_id: fakeId,
    });

    if (error) throw error;

    expect(data.length).toBe(0);
  });
});
