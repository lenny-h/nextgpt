import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("create_bucket function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let testBucketId: string;

  beforeAll(async () => {
    user1Client = await signInUser(
      TEST_USERS.user1.email,
      TEST_USERS.user1.password
    );
    anonymousClient = createUnauthenticatedClient();
    serviceClient = createServiceClient();
  });

  afterAll(async () => {
    // Clean up test buckets
    if (testBucketId) {
      await serviceClient
        .from("bucket_users")
        .delete()
        .eq("bucket_id", testBucketId);
      await serviceClient.from("buckets").delete().eq("id", testBucketId);
    }
  });

  it("should allow a service client to create a bucket and associate it with a user", async () => {
    const testData = generateTestData();
    const bucketName = testData.title;

    // Service client creates a bucket
    const { data, error } = await serviceClient.rpc("create_bucket", {
      p_owner: TEST_USERS.user1.id,
      p_name: bucketName,
      p_type: "small",
      p_max_size: 2 * 1024 * 1024 * 1024, // 2GB
    });

    if (error) throw error;

    testBucketId = data;

    // Verify bucket was created
    const { data: bucketData, error: bucketError } = await serviceClient
      .from("buckets")
      .select()
      .eq("id", testBucketId)
      .single();

    if (bucketError) throw bucketError;

    expect(bucketData.name).toBe(bucketName);
    expect(bucketData.owner).toBe(TEST_USERS.user1.id);
    expect(bucketData.type).toBe("small");
    expect(bucketData.users_count).toBe(1);

    // Verify user association
    const { data: userAssocData, error: userAssocError } = await serviceClient
      .from("bucket_users")
      .select()
      .eq("bucket_id", testBucketId)
      .eq("user_id", TEST_USERS.user1.id);

    if (userAssocError) throw userAssocError;

    expect(userAssocData.length).toBe(1);
  });

  it("should not allow a regular user to create a bucket", async () => {
    const testData = generateTestData();
    const bucketName = testData.title;

    // User1 tries to create a bucket but should get an error
    const { data, error } = await user1Client.rpc("create_bucket", {
      p_owner: TEST_USERS.user1.id,
      p_name: bucketName,
      p_type: "small",
      p_max_size: 2 * 1024 * 1024 * 1024, // 2GB
    });

    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it("should not allow an unauthenticated user to create a bucket", async () => {
    const testData = generateTestData();
    const bucketName = testData.title;

    // Anonymous user tries to create a bucket
    const { error } = await anonymousClient.rpc("create_bucket", {
      p_owner: TEST_USERS.user1.id,
      p_name: bucketName,
      p_type: "small",
      p_max_size: 2 * 1024 * 1024 * 1024, // 2GB
    });

    expect(error).not.toBeNull();
  });
});
