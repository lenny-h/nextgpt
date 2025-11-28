import { db } from "@workspace/server/drizzle/db.js";
import { bucketUserRoles } from "@workspace/server/drizzle/schema.js";
import { and, eq } from "drizzle-orm";
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
 * Tests for /api/protected/bucket-users routes
 * Tests authentication requirements, permissions, and user management in buckets
 */

describe("Protected API Routes - Bucket Users", () => {
  const client = testClient<ApiAppType>(app);

  let user1Cookie: string;
  let user2Cookie: string;
  let user1BucketId: string;
  let user2BucketId: string;

  beforeAll(async () => {
    user1Cookie = await signInTestUser(
      TEST_USERS.USER1_VERIFIED.email,
      TEST_USERS.USER1_VERIFIED.password
    );

    user2Cookie = await signInTestUser(
      TEST_USERS.USER2_VERIFIED.email,
      TEST_USERS.USER2_VERIFIED.password
    );

    // Create buckets for testing
    user1BucketId = await createTestBucket(TEST_USER_IDS.USER1_VERIFIED);

    user2BucketId = await createTestBucket(TEST_USER_IDS.USER2_VERIFIED);
  });

  afterAll(async () => {
    await cleanupUserBucket(user1BucketId);
    await cleanupUserBucket(user2BucketId);
  });

  describe("GET /api/protected/bucket-users/:bucketId", () => {
    it("should return 401 without authentication", async () => {
      const res = await client.api.protected["bucket-users"][":bucketId"].$get({
        param: {
          bucketId: user1BucketId,
        },
        query: {
          pageNumber: "0",
          itemsPerPage: "10",
        },
      });

      expect(res.status).toBe(401);
    });

    it("should return 403 when user is not a bucket maintainer", async () => {
      const res = await client.api.protected["bucket-users"][":bucketId"].$get(
        {
          param: {
            bucketId: user1BucketId,
          },
          query: {
            pageNumber: "0",
            itemsPerPage: "10",
          },
        },
        {
          headers: getAuthHeaders(user2Cookie),
        }
      );

      expect(res.status).toBe(403);
    });

    it("should return bucket users for bucket maintainer", async () => {
      const res = await client.api.protected["bucket-users"][":bucketId"].$get(
        {
          param: {
            bucketId: user1BucketId,
          },
          query: {
            pageNumber: "0",
            itemsPerPage: "10",
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);

      // Each user should have expected properties
      data.forEach((user) => {
        expect(user).toHaveProperty("id");
        expect(user).toHaveProperty("username");
      });
    });

    it("should validate UUID format", async () => {
      const res = await client.api.protected["bucket-users"][":bucketId"].$get(
        {
          param: {
            bucketId: "not-a-uuid",
          },
          query: {
            pageNumber: "0",
            itemsPerPage: "10",
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(400);
    });

    it("should validate pagination parameters", async () => {
      const res = await client.api.protected["bucket-users"][":bucketId"].$get(
        {
          param: {
            bucketId: user1BucketId,
          },
          query: {
            pageNumber: "invalid",
            itemsPerPage: "10",
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/protected/bucket-users/:bucketId", () => {
    it("should return 401 without authentication", async () => {
      const res = await client.api.protected["bucket-users"][":bucketId"].$post(
        {
          param: {
            bucketId: user1BucketId,
          },
          json: {
            userIds: [TEST_USER_IDS.USER2_VERIFIED],
          },
        }
      );

      expect(res.status).toBe(401);
    });

    it("should return 403 when user is not bucket owner", async () => {
      const res = await client.api.protected["bucket-users"][":bucketId"].$post(
        {
          param: {
            bucketId: user1BucketId,
          },
          json: {
            userIds: [TEST_USER_IDS.USER2_VERIFIED],
          },
        },
        {
          headers: getAuthHeaders(user2Cookie),
        }
      );

      expect(res.status).toBe(403);
    });

    it("should validate UUID format", async () => {
      const res = await client.api.protected["bucket-users"][":bucketId"].$post(
        {
          param: {
            bucketId: "not-a-uuid",
          },
          json: {
            userIds: [TEST_USER_IDS.USER2_VERIFIED],
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(400);
    });

    it("should validate user IDs array", async () => {
      const res = await client.api.protected["bucket-users"][":bucketId"].$post(
        {
          param: {
            bucketId: user1BucketId,
          },
          json: {
            userIds: ["not-a-uuid"],
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/protected/bucket-users/:bucketId", () => {
    it("should return 401 without authentication", async () => {
      const res = await client.api.protected["bucket-users"][
        ":bucketId"
      ].$delete({
        param: {
          bucketId: user1BucketId,
        },
        json: {
          userIds: [generateTestUUID()],
        },
      });

      expect(res.status).toBe(401);
    });

    it("should return 403 when user is not a bucket maintainer", async () => {
      const res = await client.api.protected["bucket-users"][
        ":bucketId"
      ].$delete(
        {
          param: {
            bucketId: user1BucketId,
          },
          json: {
            userIds: [generateTestUUID()],
          },
        },
        {
          headers: getAuthHeaders(user2Cookie),
        }
      );

      expect(res.status).toBe(403);
    });

    it("should validate UUID format", async () => {
      const res = await client.api.protected["bucket-users"][
        ":bucketId"
      ].$delete(
        {
          param: {
            bucketId: "not-a-uuid",
          },
          json: {
            userIds: [generateTestUUID()],
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(400);
    });

    it("should validate user IDs array", async () => {
      const res = await client.api.protected["bucket-users"][
        ":bucketId"
      ].$delete(
        {
          param: {
            bucketId: user1BucketId,
          },
          json: {
            userIds: ["not-a-uuid"],
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(400);
    });

    it("should remove users from bucket", async () => {
      // First, add a user to the bucket
      await db.insert(bucketUserRoles).values({
        bucketId: user1BucketId,
        userId: TEST_USER_IDS.USER2_VERIFIED,
      });

      // Verify user was added
      const [beforeDelete] = await db
        .select()
        .from(bucketUserRoles)
        .where(eq(bucketUserRoles.userId, TEST_USER_IDS.USER2_VERIFIED));
      expect(beforeDelete).toBeDefined();

      // Remove the user
      const res = await client.api.protected["bucket-users"][
        ":bucketId"
      ].$delete(
        {
          param: {
            bucketId: user1BucketId,
          },
          json: {
            userIds: [TEST_USER_IDS.USER2_VERIFIED],
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.message).toBe("Users removed");

      // Verify user was removed
      const [afterDelete] = await db
        .select()
        .from(bucketUserRoles)
        .where(
          and(
            eq(bucketUserRoles.bucketId, user1BucketId),
            eq(bucketUserRoles.userId, TEST_USER_IDS.USER2_VERIFIED)
          )
        );
      expect(afterDelete).toBeUndefined();
    });
  });

  describe("GET /api/protected/bucket-users/ilike/:bucketId", () => {
    it("should return 401 without authentication", async () => {
      const res = await client.api.protected["bucket-users"].ilike[
        ":bucketId"
      ].$get({
        param: {
          bucketId: user1BucketId,
        },
        query: {
          prefix: "test",
        },
      });

      expect(res.status).toBe(401);
    });

    it("should return 403 when user is not a bucket maintainer", async () => {
      const res = await client.api.protected["bucket-users"].ilike[
        ":bucketId"
      ].$get(
        {
          param: {
            bucketId: user1BucketId,
          },
          query: {
            prefix: "test",
          },
        },
        {
          headers: getAuthHeaders(user2Cookie),
        }
      );

      expect(res.status).toBe(403);
    });

    it("should return filtered bucket users for bucket maintainer", async () => {
      const res = await client.api.protected["bucket-users"].ilike[
        ":bucketId"
      ].$get(
        {
          param: {
            bucketId: user1BucketId,
          },
          query: {
            prefix: "user",
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeLessThanOrEqual(5); // Limited to 5 results

      // Each user should have expected properties
      data.forEach((user) => {
        expect(user).toHaveProperty("id");
        expect(user).toHaveProperty("username");
      });
    });

    it("should validate UUID format", async () => {
      const res = await client.api.protected["bucket-users"].ilike[
        ":bucketId"
      ].$get(
        {
          param: {
            bucketId: "not-a-uuid",
          },
          query: {
            prefix: "test",
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(400);
    });

    it("should validate prefix parameter", async () => {
      const res = await client.api.protected["bucket-users"].ilike[
        ":bucketId"
      ].$get(
        {
          param: {
            bucketId: user1BucketId,
          },
          query: {
            // @ts-expect-error - Testing missing parameter
            prefix: undefined,
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(400);
    });
  });
});
