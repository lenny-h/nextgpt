import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  getModelById,
  addModel,
  deleteModel,
} from "../../../src/lib/db/queries/models.js";
import { createServiceClient } from "../../../src/utils/supabase/service-client.js";
import {
  cleanupTestData,
  generateTestData,
  TEST_USERS,
} from "./config/utils.js";

// Mock server-only module
vi.mock("server-only", () => {
  return {
    // mock server-only module
  };
});

describe("models.ts query tests", async () => {
  const testModels: { id: string }[] = [];
  const testBuckets: { id: string }[] = [];

  let testUserId = TEST_USERS.user1.id;
  let testBucketId: string;
  let testModelId: string;
  let testModelName = "gpt-4o";
  let testApiKey = "sk-test-key-12345";

  const supabase = createServiceClient();

  beforeAll(async () => {
    // Create a test bucket to use for model tests
    const testData = generateTestData();
    testBucketId = testData.uuid;

    const { error: bucketError } = await supabase
      .from("buckets")
      .insert({
        id: testBucketId,
        owner: testUserId,
        name: testData.title,
        max_size: 1024 * 1024 * 1024, // 1GB
        size: 0,
        type: "small",
      })
      .select()
      .single();

    if (bucketError) throw bucketError;

    testBuckets.push({ id: testBucketId });
  });

  afterAll(async () => {
    // Clean up test data
    for (const model of testModels) {
      await cleanupTestData(supabase, "models", "id", model.id);
    }

    for (const bucket of testBuckets) {
      await cleanupTestData(supabase, "buckets", "id", bucket.id);
    }
  });

  it("should add a model to a bucket", async () => {
    // Act
    await addModel({
      bucketId: testBucketId,
      modelName: testModelName,
      encApiKey: testApiKey,
    });

    // Check if the model was actually created
    const { data: model, error } = await supabase
      .from("models")
      .select()
      .eq("bucket_id", testBucketId)
      .eq("name", testModelName)
      .single();

    if (error) {
      throw error;
    }

    testModelId = model.id;
    testModels.push({ id: testModelId });

    expect(model.bucket_id).toBe(testBucketId);
    expect(model.name).toBe(testModelName);
    expect(model?.enc_api_key).toBe(testApiKey);
  });

  it("should get a model by id and bucket id", async () => {
    // Arrange
    const testData = generateTestData();
    const modelId = testData.uuid;
    const modelName = "gpt-4o";
    const resourceName = "test-resource";
    const deploymentId = "test-deployment-id";

    const encApiKey =
      "enc_test_api_key_" + Math.random().toString(36).substring(7);

    // Create a test model
    const { error } = await supabase
      .from("models")
      .insert({
        id: modelId,
        bucket_id: testBucketId,
        name: modelName,
        resource_name: resourceName,
        deployment_id: deploymentId,
        enc_api_key: encApiKey,
      })
      .select()
      .single();

    if (error) throw error;

    testModels.push({ id: modelId });

    // Act
    const result = await getModelById({
      id: modelId,
      bucketId: testBucketId,
    });

    // Assert
    expect(result).toBeDefined();
    expect(result.model_name).toBe(modelName);
    expect(result.resource_name).toBe(resourceName);
    expect(result.deployment_id).toBe(deploymentId);
    expect(result.api_key).toBe(encApiKey);
  });

  it("should throw error when model does not exist", async () => {
    // Arrange
    const nonExistentId = "00000000-0000-0000-0000-000000000000";

    // Act & Assert
    await expect(async () => {
      await getModelById({
        id: nonExistentId,
        bucketId: testBucketId,
      });
    }).rejects.toThrow("Model not found");
  });

  it("should throw error when bucket id does not match", async () => {
    // Arrange
    const testData = generateTestData();
    const modelId = testData.uuid;
    const wrongBucketId = "00000000-0000-0000-0000-000000000000";
    const resourceName = "test-resource";
    const deploymentId = "test-deployment-id";

    // Create a test model
    const { error } = await supabase
      .from("models")
      .insert({
        id: modelId,
        bucket_id: testBucketId,
        name: "test-model",
        resource_name: resourceName,
        deployment_id: deploymentId,
        enc_api_key: "enc_test_api_key",
      })
      .select()
      .single();

    if (error) throw error;

    testModels.push({ id: modelId });

    // Act & Assert
    await expect(async () => {
      await getModelById({
        id: modelId,
        bucketId: wrongBucketId,
      });
    }).rejects.toThrow("Model not found");
  });

  it("should delete a model", async () => {
    // Act
    await deleteModel({ modelId: testModelId });

    // Check if model was actually deleted
    const { data: models, error } = await supabase
      .from("models")
      .select()
      .eq("id", testModelId);

    if (error) {
      throw error;
    }

    expect(models.length).toBe(0);

    // Remove from tracking array
    const index = testModels.findIndex((m) => m.id === testModelId);
    if (index !== -1) {
      testModels.splice(index, 1);
    }
  });
});
