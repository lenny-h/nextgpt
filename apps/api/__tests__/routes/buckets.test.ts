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
import { buckets } from "@workspace/server/drizzle/schema.js";
import { eq } from "drizzle-orm";
import { db } from "@workspace/server/drizzle/db.js";

/**
 * Tests for /api/protected/buckets routes
 * Tests authentication requirements, data isolation, and permissions
 */

describe("Protected API Routes - Buckets", () => {
  const client = testClient<ApiAppType>(app);

  let user1Cookie: string;
  let user2Cookie: string;
  let fixtureBucketId: string;
  const createdBucketIds: string[] = [];

  beforeAll(async () => {
    user1Cookie = await signInTestUser(
      TEST_USERS.USER1_VERIFIED.email,
      TEST_USERS.USER1_VERIFIED.password
    );

    user2Cookie = await signInTestUser(
      TEST_USERS.USER2_VERIFIED.email,
      TEST_USERS.USER2_VERIFIED.password
    );

    // Create a fixture bucket for User 1 to use in GET tests
    fixtureBucketId = await createTestBucket(TEST_USER_IDS.USER1_VERIFIED, {
      name: `fixture-bucket-${Date.now()}`,
    });
    createdBucketIds.push(fixtureBucketId);
  });

  afterAll(async () => {
    for (const id of createdBucketIds) {
      await cleanupUserBucket(id);
    }
  });

  describe("POST /api/protected/buckets", () => {
    it("should return 401 without authentication", async () => {
      const res = await client.api.protected.buckets.$post({
        json: {
          values: {
            bucketName: "Test Bucket",
            public: false,
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
          public: false,
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

      // Verify bucket exists in DB
      const [record] = await db
        .select()
        .from(buckets)
        .where(eq(buckets.name, uniqueName));
      expect(record).toBeDefined();

      // Track for cleanup
      if (record) {
        createdBucketIds.push(record.id);
      }
    });

    it("should validate bucket name length", async () => {
      // Too short
      const resShort = await client.api.protected.buckets.$post(
        {
          json: {
            values: {
              bucketName: "ab", // Less than 3 characters
              public: false,
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
              public: false,
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
              public: false,
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

      // Should contain at least the fixture bucket
      const fixture = data.find((b) => b.id === fixtureBucketId);
      expect(fixture).toBeDefined();
      expect(fixture?.owner).toBe(TEST_USER_IDS.USER1_VERIFIED);

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

      // The fixture bucket should be in user1's list but not user2's
      expect(user1BucketIds).toContain(fixtureBucketId);
      expect(user2BucketIds).not.toContain(fixtureBucketId);

      // There should be no overlap unless they share buckets (which they shouldn't in this test setup)
      const overlap = user1BucketIds.filter((id: string) =>
        user2BucketIds.includes(id)
      );
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

      // Should contain at least the fixture bucket
      const fixture = data.find((b) => b.bucketId === fixtureBucketId);
      expect(fixture).toBeDefined();

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

      const user1Ids = user1Buckets.map((b) => b.bucketId);
      const user2Ids = user2Buckets.map((b) => b.bucketId);

      expect(user1Ids).toContain(fixtureBucketId);
      expect(user2Ids).not.toContain(fixtureBucketId);
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
      const bucketToDeleteId = await createTestBucket(
        TEST_USER_IDS.USER1_VERIFIED
      );
      createdBucketIds.push(bucketToDeleteId);

      // Try to delete with user2 (should fail with 403)
      const deleteRes = await client.api.protected.buckets[":bucketId"].$delete(
        {
          param: {
            bucketId: bucketToDeleteId,
          },
        },
        {
          headers: getAuthHeaders(user2Cookie),
        }
      );

      expect(deleteRes.status).toBe(403);
    });

    it("should allow owner to delete their bucket", async () => {
      // Create bucket with user1
      const bucketToDeleteId = await createTestBucket(
        TEST_USER_IDS.USER1_VERIFIED
      );
      createdBucketIds.push(bucketToDeleteId);

      // Delete with user1
      const deleteRes = await client.api.protected.buckets[":bucketId"].$delete(
        {
          param: {
            bucketId: bucketToDeleteId,
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(deleteRes.status).toBe(200);

      // Verify it's gone
      const [record] = await db
        .select()
        .from(buckets)
        .where(eq(buckets.id, bucketToDeleteId));
      expect(record).toBeUndefined();
    });
  });
});
