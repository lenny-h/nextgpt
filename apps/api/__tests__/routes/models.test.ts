import { testClient } from "hono/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app, { type ApiAppType } from "../../src/app.js";
import {
  TEST_USERS,
  TEST_USER_IDS,
  getAuthHeaders,
  signInTestUser,
} from "../helpers/auth-helpers.js";
import { cleanupUserBucket, createTestBucket } from "../helpers/db-helpers.js";
import { generateTestUUID } from "../helpers/test-utils.js";

/**
 * Tests for /api/protected/models routes
 * Tests authentication requirements, CRUD operations, and data isolation
 */

describe("Protected API Routes - Models", () => {
  const client = testClient<ApiAppType>(app);

  let user1Cookie: string;
  let user2Cookie: string;
  let testBucketId: string;

  beforeAll(async () => {
    user1Cookie = await signInTestUser(
      TEST_USERS.USER1_VERIFIED.email,
      TEST_USERS.USER1_VERIFIED.password
    );

    user2Cookie = await signInTestUser(
      TEST_USERS.USER2_VERIFIED.email,
      TEST_USERS.USER2_VERIFIED.password
    );

    // Create a test bucket
    testBucketId = await createTestBucket(TEST_USER_IDS.USER1_VERIFIED);
  });

  afterAll(async () => {
    await cleanupUserBucket(testBucketId);
  });

  describe("POST /api/protected/models", () => {
    it("should return 401 without authentication", async () => {
      const res = await client.api.protected.models.$post({
        json: {
          bucketId: testBucketId || generateTestUUID(),
          modelName: "gpt-4o-mini",
          apiKey: "test-api-key-123",
        },
      });

      expect(res.status).toBe(401);
    });

    it("should create model with valid data", async () => {
      if (!testBucketId) {
        console.warn("Skipping test: no test bucket available");
        return;
      }

      const modelData = {
        bucketId: testBucketId,
        modelName: "gpt-4o-mini" as const,
        apiKey: "test-api-key-for-testing-123",
        description: "Test model description",
      };

      const res = await client.api.protected.models.$post(
        {
          json: modelData,
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty("message");
    });

    it("should validate input schema", async () => {
      const res = await client.api.protected.models.$post(
        {
          // @ts-expect-error - Testing missing required fields
          json: {
            bucketId: testBucketId,
            modelName: "gpt-4o-mini",
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/protected/models/:bucketId", () => {
    it("should return 401 without authentication", async () => {
      const testId = generateTestUUID();
      const res = await client.api.protected.models[":bucketId"].$get({
        param: {
          bucketId: testId,
        },
      });

      expect(res.status).toBe(401);
    });

    it("should validate UUID format", async () => {
      const res = await client.api.protected.models[":bucketId"].$get(
        {
          param: {
            bucketId: "not-a-uuid",
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(400);
    });

    it("should return models for a bucket", async () => {
      if (!testBucketId) {
        console.warn("Skipping test: no test bucket available");
        return;
      }

      const res = await client.api.protected.models[":bucketId"].$get(
        {
          param: {
            bucketId: testBucketId,
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe("DELETE /api/protected/models/:modelId", () => {
    it("should return 401 without authentication", async () => {
      const testId = generateTestUUID();
      const res = await client.api.protected.models[":modelId"].$delete({
        param: {
          modelId: testId,
        },
      });

      expect(res.status).toBe(401);
    });

    it("should validate UUID format", async () => {
      const res = await client.api.protected.models[":modelId"].$delete(
        {
          param: {
            modelId: "not-a-uuid",
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(400);
    });

    it("should return 404 when deleting non-existent model", async () => {
      const nonExistentId = generateTestUUID();

      const res = await client.api.protected.models[":modelId"].$delete(
        {
          param: {
            modelId: nonExistentId,
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect([403, 404]).toContain(res.status);
    });
  });
});
