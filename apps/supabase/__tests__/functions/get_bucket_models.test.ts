import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("get_bucket_models function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let user2Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let testBucketId: string;
  let testModelIds: string[] = [];

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

    // Add user1 as maintainer and user of the bucket
    const { error: maintainerError } = await serviceClient
      .from("bucket_maintainers")
      .insert({ bucket_id: testBucketId, user_id: TEST_USERS.user1.id });

    if (maintainerError) throw maintainerError;

    const { error: userError } = await serviceClient
      .from("bucket_users")
      .insert({ bucket_id: testBucketId, user_id: TEST_USERS.user1.id });

    if (userError) throw userError;

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
    await serviceClient.from("models").delete().in("id", testModelIds);
    await serviceClient.from("buckets").delete().eq("id", testBucketId);
  });

  it("should allow the bucket owner to retrieve models", async () => {
    const { data, error } = await user1Client.rpc("get_bucket_models");

    if (error) throw error;

    expect(data.length).toBeGreaterThan(0);

    // Verify our test models are in the results
    testModelIds.forEach((testModelId) => {
      const testModel = data.find((model) => model.id === testModelId);
      expect(testModel).toBeDefined();
      expect(testModel?.bucket_id).toBe(testBucketId);
      expect(testModel?.bucket_name).toBeDefined();
    });
  });

  it("should not allow unauthorized users to access bucket models", async () => {
    // User2 should not be able to access User1's bucket models
    const { data: user2Data, error: user2Error } =
      await user2Client.rpc("get_bucket_models");

    if (user2Error) throw user2Error;

    // User2 shouldn't see models from user1's bucket
    testModelIds.forEach((testModelId) => {
      const testModel = user2Data.find((model) => model.id === testModelId);
      expect(testModel).toBeUndefined();
    });
  });

  it("should not allow unauthenticated access", async () => {
    const { data, error } = await anonymousClient.rpc("get_bucket_models");

    if (error) throw error;

    expect(data.length).toBe(0);
  });
});
