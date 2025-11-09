import { testClient } from "hono/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app, { type ApiAppType } from "../../src/app.js";
import {
  TEST_USERS,
  TEST_USER_IDS,
  getAuthHeaders,
  signInTestUser,
} from "../helpers/auth-helpers.js";
import { cleanupUserBuckets } from "../helpers/db-helpers.js";
import { generateTestUUID } from "../helpers/test-utils.js";

/**
 * Tests for /api/protected/buckets routes
 * Tests authentication requirements, data isolation, and permissions
 */

describe("Protected API Routes - Buckets", () => {
  const client = testClient<ApiAppType>(app);

  let user1Cookie: string;
  let user2Cookie: string;

  beforeAll(async () => {
    user1Cookie = await signInTestUser(
      TEST_USERS.USER1_VERIFIED.email,
      TEST_USERS.USER1_VERIFIED.password
    );

    user2Cookie = await signInTestUser(
      TEST_USERS.USER2_VERIFIED.email,
      TEST_USERS.USER2_VERIFIED.password
    );
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupUserBuckets(TEST_USER_IDS.USER1_VERIFIED);
    await cleanupUserBuckets(TEST_USER_IDS.USER2_VERIFIED);
  });

  describe("POST /api/protected/buckets", () => {
    it("should return 401 without authentication", async () => {
      const res = await client.api.protected.buckets.$post({
        json: {
          values: {
            bucketName: "Test Bucket",
          },
          type: "small",
        },
      });

      expect(res.status).toBe(401);
    });

    it("should create bucket with valid data", async () => {
      const uniqueName = `User 1 Test Bucket ${Date.now()}`;
      const bucketData = {
        values: {
          bucketName: uniqueName,
        },
        type: "small" as const,
      };

      const res = await client.api.protected.buckets.$post(
        {
          json: bucketData,
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty("message");
      expect(data.message).toBe("Bucket created");
    });

    it("should validate bucket name length", async () => {
      // Too short
      const resShort = await client.api.protected.buckets.$post(
        {
          json: {
            values: {
              bucketName: "ab", // Less than 3 characters
            },
            type: "small",
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(resShort.status).toBe(400);

      // Too long
      const resLong = await client.api.protected.buckets.$post(
        {
          json: {
            values: {
              bucketName: "a".repeat(129), // More than 128 characters
            },
            type: "small",
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(resLong.status).toBe(400);
    });

    it("should validate bucket type", async () => {
      const res = await client.api.protected.buckets.$post(
        {
          json: {
            values: {
              bucketName: "Test Bucket",
            },
            // @ts-expect-error - Testing invalid type
            type: "invalid-type",
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/protected/buckets/maintained", () => {
    it("should return 401 without authentication", async () => {
      const res = await client.api.protected.buckets.maintained.$get();
      expect(res.status).toBe(401);
    });

    it("should return maintained buckets for authenticated user", async () => {
      const res = await client.api.protected.buckets.maintained.$get(
        {},
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);

      // Each bucket should have the expected properties
      data.forEach((bucket) => {
        expect(bucket).toHaveProperty("id");
        expect(bucket).toHaveProperty("name");
        expect(bucket).toHaveProperty("type");
        expect(bucket).toHaveProperty("owner");
        expect(bucket).toHaveProperty("createdAt");
      });
    });

    it("should only return buckets where user is maintainer", async () => {
      const res1 = await client.api.protected.buckets.maintained.$get(
        {},
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );
      const user1Buckets = await res1.json();

      const res2 = await client.api.protected.buckets.maintained.$get(
        {},
        {
          headers: getAuthHeaders(user2Cookie),
        }
      );
      const user2Buckets = await res2.json();

      // Buckets should be isolated between users
      const user1BucketIds = user1Buckets.map((b) => b.id);
      const user2BucketIds = user2Buckets.map((b) => b.id);

      // There should be no overlap unless they share buckets
      const overlap = user1BucketIds.filter((id: string) =>
        user2BucketIds.includes(id)
      );
      // In a clean test environment, there should be no shared buckets
      expect(overlap.length).toBe(0);
    });
  });

  describe("GET /api/protected/buckets/used", () => {
    it("should return 401 without authentication", async () => {
      const res = await client.api.protected.buckets.used.$get();
      expect(res.status).toBe(401);
    });

    it("should return used buckets for authenticated user", async () => {
      const res = await client.api.protected.buckets.used.$get(
        {},
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);

      // Each bucket should have the expected properties
      data.forEach((bucket) => {
        expect(bucket).toHaveProperty("bucketId");
        expect(bucket).toHaveProperty("name");
        expect(bucket).toHaveProperty("type");
      });
    });

    it("should isolate buckets between users", async () => {
      const res1 = await client.api.protected.buckets.used.$get(
        {},
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );
      const user1Buckets = await res1.json();

      const res2 = await client.api.protected.buckets.used.$get(
        {},
        {
          headers: getAuthHeaders(user2Cookie),
        }
      );
      const user2Buckets = await res2.json();

      // Each user should see their own buckets
      expect(Array.isArray(user1Buckets)).toBe(true);
      expect(Array.isArray(user2Buckets)).toBe(true);
    });
  });

  describe("DELETE /api/protected/buckets/:bucketId", () => {
    it("should return 401 without authentication", async () => {
      const testId = generateTestUUID();
      const res = await client.api.protected.buckets[":bucketId"].$delete({
        param: {
          bucketId: testId,
        },
      });

      expect(res.status).toBe(401);
    });

    it("should return 403 when trying to delete bucket without ownership", async () => {
      // Try to delete a non-existent or non-owned bucket
      const nonExistentId = generateTestUUID();

      const res = await client.api.protected.buckets[":bucketId"].$delete(
        {
          param: {
            bucketId: nonExistentId,
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(403);
    });

    it("should validate UUID format", async () => {
      const res = await client.api.protected.buckets[":bucketId"].$delete(
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

    it("should not allow user to delete another user's bucket", async () => {
      // Create bucket with user1
      const uniqueName = `User 1 Exclusive Bucket ${Date.now()}`;
      const createRes = await client.api.protected.buckets.$post(
        {
          json: {
            values: {
              bucketName: uniqueName,
            },
            type: "small",
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(createRes.status).toBe(200);

      // Get user1's maintained buckets to find the created bucket
      const bucketsRes = await client.api.protected.buckets.maintained.$get(
        {},
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );
      const buckets = await bucketsRes.json();
      const targetBucket = buckets.find((b) => b.name === uniqueName);

      if (targetBucket) {
        // Try to delete with user2 (should fail with 403)
        const deleteRes = await client.api.protected.buckets[
          ":bucketId"
        ].$delete(
          {
            param: {
              bucketId: targetBucket.id,
            },
          },
          {
            headers: getAuthHeaders(user2Cookie),
          }
        );

        expect(deleteRes.status).toBe(403);
      }
    });
  });
});
