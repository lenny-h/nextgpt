import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("increase_bucket_size function", () => {
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
  });

  afterAll(async () => {
    // Clean up test data
    if (testBucketId) {
      await serviceClient.from("buckets").delete().eq("id", testBucketId);
    }
  });

  it("should allow cumulative size increases by service account", async () => {
    // Get current bucket size
    const { data: currentData, error: currentError } = await serviceClient
      .from("buckets")
      .select("size")
      .eq("id", testBucketId)
      .single();

    if (currentError) throw currentError;

    const currentSize = currentData.size;

    const fileSize = 2 * 1024 * 1024;

    const { error } = await serviceClient.rpc("increase_bucket_size", {
      p_bucket_id: testBucketId,
      p_file_size: fileSize,
    });

    if (error) throw error;

    // Verify that the bucket size was increased again
    const { data, error: fetchError } = await serviceClient
      .from("buckets")
      .select("size")
      .eq("id", testBucketId)
      .single();

    if (fetchError) throw fetchError;

    expect(data.size).toBe(currentSize + fileSize);
  });

  it("should handle negative file sizes to decrease bucket size", async () => {
    // Get current bucket size
    const { data: currentData, error: currentError } = await serviceClient
      .from("buckets")
      .select("size")
      .eq("id", testBucketId)
      .single();

    if (currentError) throw currentError;

    const currentSize = currentData.size;
    const reductionSize = -1 * 1024 * 1024;

    const { error } = await serviceClient.rpc("increase_bucket_size", {
      p_bucket_id: testBucketId,
      p_file_size: reductionSize,
    });

    if (error) throw error;

    // Verify that the bucket size was decreased
    const { data, error: fetchError } = await serviceClient
      .from("buckets")
      .select("size")
      .eq("id", testBucketId)
      .single();

    if (fetchError) throw fetchError;

    expect(data.size).toBe(currentSize + reductionSize);
  });

  it("should throw an error for non-existent bucket (even for service account)", async () => {
    const nonExistentBucketId = "00000000-0000-0000-0000-000000000000";
    const fileSize = 1024 * 1024;

    const { error } = await serviceClient.rpc("increase_bucket_size", {
      p_bucket_id: nonExistentBucketId,
      p_file_size: fileSize,
    });

    // Should return an error since the bucket doesn't exist
    expect(error).not.toBeNull();
    expect(error?.message).toContain("not found");
  });

  it("should not allow any regular users to increase bucket size", async () => {
    const fileSize = 1024 * 1024;

    // User1 (owner) should not be able to increase bucket size
    const { error: user1Error } = await user1Client.rpc(
      "increase_bucket_size",
      {
        p_bucket_id: testBucketId,
        p_file_size: fileSize,
      }
    );

    expect(user1Error).not.toBeNull();
    expect(user1Error?.message).toContain("not found");

    // User2 should not be able to increase bucket size either
    const { error: user2Error } = await user2Client.rpc(
      "increase_bucket_size",
      {
        p_bucket_id: testBucketId,
        p_file_size: fileSize,
      }
    );

    expect(user2Error).not.toBeNull();
    expect(user2Error?.message).toContain("not found");
  });

  it("should not allow unauthenticated access", async () => {
    const fileSize = 1024 * 1024;

    const { error } = await anonymousClient.rpc("increase_bucket_size", {
      p_bucket_id: testBucketId,
      p_file_size: fileSize,
    });

    expect(error).not.toBeNull();
    expect(error?.message).toContain("not found");
  });
});
