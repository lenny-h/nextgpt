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
  cleanupTestCourse,
  cleanupUserBucket,
  createTestBucket,
  createTestCourse,
} from "../helpers/db-helpers.js";
import { generateTestUUID } from "../helpers/test-utils.js";
import { courses } from "@workspace/server/drizzle/schema.js";
import { eq } from "drizzle-orm";
import { db } from "@workspace/server/drizzle/db.js";

/**
 * Tests for /api/protected/courses routes
 * Tests authentication requirements, CRUD operations, and access control
 */

describe("Protected API Routes - Courses", () => {
  const client = testClient<ApiAppType>(app);

  let user1Cookie: string;
  let user2Cookie: string;
  let fixtureBucketId: string;
  let fixtureCourseId: string;
  const createdBucketIds: string[] = [];
  const createdCourseIds: string[] = [];

  beforeAll(async () => {
    user1Cookie = await signInTestUser(
      TEST_USERS.USER1_VERIFIED.email,
      TEST_USERS.USER1_VERIFIED.password
    );

    user2Cookie = await signInTestUser(
      TEST_USERS.USER2_VERIFIED.email,
      TEST_USERS.USER2_VERIFIED.password
    );

    // Create a test bucket directly in the database for deterministic tests
    fixtureBucketId = await createTestBucket(TEST_USER_IDS.USER1_VERIFIED);
    createdBucketIds.push(fixtureBucketId);

    // Create a test course
    fixtureCourseId = await createTestCourse(
      TEST_USER_IDS.USER1_VERIFIED,
      fixtureBucketId,
      {
        name: "Fixture Course",
      }
    );
    createdCourseIds.push(fixtureCourseId);
  });

  afterAll(async () => {
    // Clean up courses first
    for (const courseId of createdCourseIds) {
      await cleanupTestCourse(courseId);
    }

    // Clean up buckets
    for (const bucketId of createdBucketIds) {
      await cleanupUserBucket(bucketId);
    }
  });

  describe("POST /api/protected/courses", () => {
    it("should return 401 without authentication", async () => {
      const res = await client.api.protected.courses.$post({
        json: {
          values: {
            bucketId: fixtureBucketId,
            courseName: "Test Course",
            courseDescription: "Test course description",
          },
        },
      });

      expect(res.status).toBe(401);
    });

    it("should create course with valid data", async () => {
      const courseName = `Test Course ${Date.now()}`;
      const courseData = {
        values: {
          bucketId: fixtureBucketId,
          courseName: courseName,
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

      // Verify in DB and track for cleanup
      const [record] = await db
        .select()
        .from(courses)
        .where(eq(courses.name, courseName));

      if (record) {
        createdCourseIds.push(record.id);
      }
    });

    it("should validate input schema", async () => {
      const res = await client.api.protected.courses.$post(
        {
          json: {
            // @ts-expect-error - Testing missing required fields
            values: {
              bucketId: fixtureBucketId,
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
      const res = await client.api.protected.courses[":bucketId"].$get(
        {
          param: {
            bucketId: fixtureBucketId,
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

      // Should contain our fixture course
      const found = data.find((c) => c.id === fixtureCourseId);
      expect(found).toBeDefined();
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

      expect(res.status).toBe(404);
    });

    it("should allow owner to delete their course", async () => {
      // Create a course to delete
      const courseToDeleteId = await createTestCourse(
        TEST_USER_IDS.USER1_VERIFIED,
        fixtureBucketId
      );
      createdCourseIds.push(courseToDeleteId);

      const res = await client.api.protected.courses[":courseId"].$delete(
        {
          param: {
            courseId: courseToDeleteId,
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(200);

      // Verify it's gone
      const [record] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, courseToDeleteId));
      expect(record).toBeUndefined();
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

      // Should contain our fixture course
      const found = data.find((c) => c.id === fixtureCourseId);
      expect(found).toBeDefined();
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
      const res = await client.api.protected.courses.ilike[":bucketId"].$get(
        {
          param: {
            bucketId: fixtureBucketId,
          },
          query: {
            prefix: "Fixture",
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);

      // Should contain our fixture course
      const found = data.find((c) => c.id === fixtureCourseId);
      expect(found).toBeDefined();
    });

    it("should return 403 when user doesn't have access to bucket", async () => {
      // user2 tries to access user1's bucket
      const res = await client.api.protected.courses.ilike[":bucketId"].$get(
        {
          param: {
            bucketId: fixtureBucketId,
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
  });
});
