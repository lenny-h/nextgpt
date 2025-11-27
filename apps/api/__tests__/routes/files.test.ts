import { testClient } from "hono/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app, { type ApiAppType } from "../../src/app.js";
import {
  getAuthHeaders,
  signInTestUser,
  TEST_USER_IDS,
  TEST_USERS,
} from "../helpers/auth-helpers.js";
import {
  createTestBucket,
  createTestCourse,
  createTestFile,
  cleanupUserBucket,
} from "../helpers/db-helpers.js";

describe("Protected API Routes - Files", () => {
  const client = testClient<ApiAppType>(app);

  let user1Cookie: string;
  let user2Cookie: string;
  let bucketId: string;
  let courseId: string;
  let fileId: string;

  beforeAll(async () => {
    user1Cookie = await signInTestUser(
      TEST_USERS.USER1_VERIFIED.email,
      TEST_USERS.USER1_VERIFIED.password
    );

    user2Cookie = await signInTestUser(
      TEST_USERS.USER2_VERIFIED.email,
      TEST_USERS.USER2_VERIFIED.password
    );

    // Create dynamic data
    bucketId = await createTestBucket(TEST_USER_IDS.USER1_VERIFIED);
    courseId = await createTestCourse(TEST_USER_IDS.USER1_VERIFIED, bucketId);
    fileId = await createTestFile(courseId);
  });

  afterAll(async () => {
    await cleanupUserBucket(bucketId);
  });

  describe("GET /api/protected/files", () => {
    it("should return files for given courses", async () => {
      const res = await client.api.protected.files.$get(
        {
          query: {
            bucketId: bucketId,
            courseIds: [courseId],
            pageNumber: "0",
            itemsPerPage: "10",
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(200);
      const files = await res.json();
      expect(Array.isArray(files)).toBe(true);
      // Should contain at least the seeded file
      expect(files.some((f) => f.courseId === courseId)).toBe(true);
      expect(files.some((f) => f.id === fileId)).toBe(true);
    });
  });
});
