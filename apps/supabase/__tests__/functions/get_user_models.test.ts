import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("get_user_models function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let user2Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let testBucketId: string;
  let testModelIds: string[] = [];

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
        max_size: 2 * 1024 * 1024 * 1024,
        type: "small",
      })
      .select()
      .single();

    if (bucketError) throw bucketError;

    testBucketId = bucket.id;

    // Add user1 to bucket_users table as maintainer
    const { error: bucketUserError } = await serviceClient
      .from("bucket_users")
      .insert({
        bucket_id: testBucketId,
        user_id: TEST_USERS.user1.id,
      });

    if (bucketUserError) throw bucketUserError;

    // Create multiple test models in the bucket
    for (let i = 0; i < 3; i++) {
      const modelData = generateTestData();
      const { data: model, error: modelError } = await serviceClient
        .from("models")
        .insert({
          name: modelData.title,
          bucket_id: testBucketId,
          enc_api_key: "test-api-key",
        })
        .select()
        .single();

      if (modelError) throw modelError;

      testModelIds.push(model.id);
    }
  });

  afterAll(async () => {
    // Clean up the test data
    await serviceClient.from("models").delete().in("id", testModelIds);

    // First delete from bucket_users
    await serviceClient
      .from("bucket_users")
      .delete()
      .eq("bucket_id", testBucketId)
      .eq("user_id", TEST_USERS.user1.id);

    // Then delete the bucket
    await serviceClient.from("buckets").delete().eq("id", testBucketId);
  });

  it("should return models for a specific bucket", async () => {
    const { data, error } = await user1Client.rpc("get_user_models", {
      p_bucket_id: testBucketId,
    });

    if (error) throw error;

    expect(data.length).toBe(3);

    // Verify our test models are in the results
    testModelIds.forEach((testModelId) => {
      const testModel = data.find((model) => model.id === testModelId);
      expect(testModel).toBeDefined();
      expect(testModel!.name).toBeDefined();
    });
  });

  it("should not return models from unauthorized buckets", async () => {
    // User2 should not be able to access User1's bucket models
    const { data: user2Data, error: user2Error } = await user2Client.rpc(
      "get_user_models",
      {
        p_bucket_id: testBucketId,
      }
    );

    if (user2Error) throw user2Error;

    expect(user2Data.length).toBe(0);
  });

  it("should not allow unauthenticated access", async () => {
    const { data, error } = await anonymousClient.rpc("get_user_models", {
      p_bucket_id: testBucketId,
    });

    if (error) throw error;

    expect(data.length).toBe(0);
  });
});
