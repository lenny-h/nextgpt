import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("get_maintained_buckets function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let user2Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let testBucketIds: string[] = [];

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

    // Create multiple test buckets owned by user1
    for (let i = 0; i < 3; i++) {
      const testData = generateTestData();
      const { data, error } = await serviceClient
        .from("buckets")
        .insert({
          name: `Test Bucket ${i}: ${testData.title}`,
          owner: TEST_USERS.user1.id,
          max_size: 2 * 1024 * 1024 * 1024,
          type: "medium",
        })
        .select()
        .single();

      if (error) throw error;
      testBucketIds.push(data.id);

      // Add user1 as maintainer and user of the bucket
      const { error: maintainerError } = await serviceClient
        .from("bucket_maintainers")
        .insert({ bucket_id: data.id, user_id: TEST_USERS.user1.id });
      if (maintainerError) throw maintainerError;

      // const { error: userError } = await serviceClient
      //   .from("bucket_users")
      //   .insert({ bucket_id: data.id, user_id: TEST_USERS.user1.id });
      // if (userError) throw userError;
    }

    // Create a test bucket owned by user2
    const user2TestData = generateTestData();
    const { data, error } = await serviceClient
      .from("buckets")
      .insert({
        name: user2TestData.title,
        owner: TEST_USERS.user2.id,
        max_size: 2 * 1024 * 1024 * 1024,
        type: "medium",
      })
      .select()
      .single();

    if (error) throw error;
    testBucketIds.push(data.id);

    // Add user2 as maintainer and user of the bucket
    const { error: maintainerError } = await serviceClient
      .from("bucket_maintainers")
      .insert({ bucket_id: data.id, user_id: TEST_USERS.user2.id });
    if (maintainerError) throw maintainerError;

    // const { error: userError } = await serviceClient
    //   .from("bucket_users")
    //   .insert({ bucket_id: data.id, user_id: TEST_USERS.user2.id });
    // if (userError) throw userError;
  });

  afterAll(async () => {
    // Clean up all test buckets
    for (const id of testBucketIds) {
      await serviceClient.from("buckets").delete().eq("id", id);
    }
  });

  it("should allow a user to retrieve their owned buckets", async () => {
    // User1 retrieves their owned buckets
    const { data, error } = await user1Client.rpc("get_maintained_buckets");

    if (error) throw error;

    // Should find at least the 3 test buckets
    expect(data.length).toBeGreaterThanOrEqual(3);

    // Verify all returned buckets are owned by user1
    for (const bucket of data) {
      expect(bucket.owner).toBe(TEST_USERS.user1.id);
    }

    // Verify our test buckets are in the results
    for (let i = 0; i < 3; i++) {
      const testBucket = data.find((b) => b.id === testBucketIds[i]);
      expect(testBucket).toBeDefined();
    }
  });

  it("should only return buckets owned by the requesting user", async () => {
    // User2 retrieves their owned buckets
    const { data, error } = await user2Client.rpc("get_maintained_buckets");

    if (error) throw error;

    // Verify all returned buckets are owned by user2
    for (const bucket of data) {
      expect(bucket.owner).toBe(TEST_USERS.user2.id);
    }

    // Verify user1's test buckets are NOT in the results
    for (let i = 0; i < 3; i++) {
      const user1Bucket = data.find((b) => b.id === testBucketIds[i]);
      expect(user1Bucket).toBeUndefined();
    }

    // Verify user2's test bucket IS in the results
    const user2Bucket = data.find((b) => b.id === testBucketIds[3]);
    expect(user2Bucket).toBeDefined();
  });

  it("should not allow unauthenticated access", async () => {
    const { data, error } = await anonymousClient.rpc("get_maintained_buckets");

    if (error) throw error;

    expect(data.length).toBe(0);
  });
});
