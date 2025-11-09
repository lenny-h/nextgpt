import { testClient } from "hono/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app, { type ApiAppType } from "../../src/app.js";
import {
  TEST_USERS,
  TEST_USER_IDS,
  getAuthHeaders,
  signInTestUser,
} from "../helpers/auth-helpers.js";
import {
  cleanupBucketCourses,
  cleanupUserBuckets,
} from "../helpers/cleanup-helpers.js";
import { generateTestUUID } from "../helpers/test-utils.js";

/**
 * Tests for /api/protected/courses routes
 * Tests authentication requirements, CRUD operations, and access control
 */

describe("Protected API Routes - Courses", () => {
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

    // Create a test bucket for user1
    const bucketRes = await client.api.protected.buckets.$post(
      {
        json: {
          values: {
            bucketName: `Test Bucket for Courses ${Date.now()}`,
          },
          type: "small",
        },
      },
      {
        headers: getAuthHeaders(user1Cookie),
      }
    );

    if (bucketRes.status === 200) {
      const bucketsRes = await client.api.protected.buckets.maintained.$get(
        {},
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );
      const buckets = await bucketsRes.json();
      testBucketId = buckets[0]?.id;
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (testBucketId) {
      await cleanupBucketCourses(testBucketId);
    }
    await cleanupUserBuckets(TEST_USER_IDS.USER1_VERIFIED);
    await cleanupUserBuckets(TEST_USER_IDS.USER2_VERIFIED);
  });

  describe("POST /api/protected/courses", () => {
    it("should return 401 without authentication", async () => {
      const res = await client.api.protected.courses.$post({
        json: {
          values: {
            bucketId: testBucketId,
            courseName: "Test Course",
            courseDescription: "Test course description",
          },
        },
      });

      expect(res.status).toBe(401);
    });

    it("should create course with valid data", async () => {
      if (!testBucketId) {
        console.warn("Skipping test: no test bucket available");
        return;
      }

      const courseData = {
        values: {
          bucketId: testBucketId,
          courseName: `Test Course ${Date.now()}`,
          courseDescription: "Test course description",
        },
      };

      const res = await client.api.protected.courses.$post(
        {
          json: courseData,
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
      const res = await client.api.protected.courses.$post(
        {
          json: {
            // @ts-expect-error - Testing missing required fields
            values: {
              bucketId: testBucketId,
              courseName: "Test",
            },
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/protected/courses/:bucketId", () => {
    it("should return 401 without authentication", async () => {
      const testId = generateTestUUID();
      const res = await client.api.protected.courses[":bucketId"].$get({
        param: {
          bucketId: testId,
        },
        query: {
          pageNumber: "0",
          itemsPerPage: "10",
        },
      });

      expect(res.status).toBe(401);
    });

    it("should validate UUID format", async () => {
      const res = await client.api.protected.courses[":bucketId"].$get(
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

    it("should return courses for a bucket", async () => {
      if (!testBucketId) {
        console.warn("Skipping test: no test bucket available");
        return;
      }

      const res = await client.api.protected.courses[":bucketId"].$get(
        {
          param: {
            bucketId: testBucketId,
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
    });
  });

  describe("DELETE /api/protected/courses/:courseId", () => {
    it("should return 401 without authentication", async () => {
      const testId = generateTestUUID();
      const res = await client.api.protected.courses[":courseId"].$delete({
        param: {
          courseId: testId,
        },
      });

      expect(res.status).toBe(401);
    });

    it("should validate UUID format", async () => {
      const res = await client.api.protected.courses[":courseId"].$delete(
        {
          param: {
            courseId: "not-a-uuid",
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(400);
    });

    it("should return 404 when deleting non-existent course", async () => {
      const nonExistentId = generateTestUUID();

      const res = await client.api.protected.courses[":courseId"].$delete(
        {
          param: {
            courseId: nonExistentId,
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect([403, 404]).toContain(res.status);
    });
  });

  describe("GET /api/protected/courses/maintained", () => {
    it("should return 401 without authentication", async () => {
      const res = await client.api.protected.courses.maintained.$get({
        query: {
          pageNumber: "0",
          itemsPerPage: "10",
        },
      });
      expect(res.status).toBe(401);
    });

    it("should return maintained courses for authenticated user", async () => {
      const res = await client.api.protected.courses.maintained.$get(
        {
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
    });
  });

  describe("GET /api/protected/courses/ilike/:bucketId", () => {
    it("should return 401 without authentication", async () => {
      const testId = generateTestUUID();
      const res = await client.api.protected.courses.ilike[":bucketId"].$get({
        param: {
          bucketId: testId,
        },
        query: {
          prefix: "test",
        },
      });

      expect(res.status).toBe(401);
    });

    it("should search courses with valid query", async () => {
      if (!testBucketId) {
        console.warn("Skipping test: no test bucket available");
        return;
      }

      const res = await client.api.protected.courses.ilike[":bucketId"].$get(
        {
          param: {
            bucketId: testBucketId,
          },
          query: {
            prefix: "test",
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
});
