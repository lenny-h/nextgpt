import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("get_user_buckets function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let user2Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let testBucketId: string;

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
      })
      .select()
      .single();

    if (bucketError) throw bucketError;

    testBucketId = bucket.id;

    // Add user1 to bucket_users table
    const { error: bucketUserError } = await serviceClient
      .from("bucket_users")
      .insert({
        bucket_id: testBucketId,
        user_id: TEST_USERS.user1.id,
      });

    if (bucketUserError) throw bucketUserError;
  });

  afterAll(async () => {
    // Clean up test data
    if (testBucketId) {
      // First delete from bucket_users
      await serviceClient
        .from("bucket_users")
        .delete()
        .eq("bucket_id", testBucketId)
        .eq("user_id", TEST_USERS.user1.id);

      // Then delete the bucket
      await serviceClient.from("buckets").delete().eq("id", testBucketId);
    }
  });

  it("should allow a user to retrieve buckets they are a member of", async () => {
    const { data, error } = await user1Client.rpc("get_user_buckets");

    if (error) throw error;

    expect(data.length).toBeGreaterThan(0);

    // Verify our test bucket is in the results
    const testBucket = data.find((bucket) => bucket.bucket_id === testBucketId);

    expect(testBucket).toBeDefined();
    expect(testBucket!.name).toBeDefined();
    expect(testBucket!.type).toBe("small");
  });

  it("should not allow a user to access buckets they are not a member of", async () => {
    // user2 should not see buckets where they are not a member
    const { data, error } = await user2Client.rpc("get_user_buckets");

    if (error) throw error;

    if (data.length > 0) {
      // Ensure user1's test bucket is not in the results
      const testBucket = data.find(
        (bucket) => bucket.bucket_id === testBucketId
      );
      expect(testBucket).toBeUndefined();
    }
  });

  it("should not allow unauthenticated access", async () => {
    const { data, error } = await anonymousClient.rpc("get_user_buckets");

    if (error) throw error;

    expect(data.length).toBe(0);
  });
});
