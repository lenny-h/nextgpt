import { testClient } from "hono/testing";
import { beforeAll, describe, expect, it } from "vitest";
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
      expect(files.some((f: any) => f.courseId === courseId)).toBe(true);
      expect(files.some((f: any) => f.id === fileId)).toBe(true);
    });
  });

  describe("POST /api/protected/get-signed-url/:courseId", () => {
    it("should return signed url for file upload", async () => {
      const res = await client.api.protected["get-signed-url"][
        ":courseId"
      ].$post(
        {
          param: {
            courseId: courseId,
          },
          json: {
            filename: "test-file.pdf",
            fileType: "application/pdf",
            fileSize: 1024,
            pageNumberOffset: 0,
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty("signedUrl");
      expect(data).toHaveProperty("extFilename");
    });

    it("should not allow unauthorized user to get signed url", async () => {
      // User 2 trying to upload to User 1's course
      const res = await client.api.protected["get-signed-url"][
        ":courseId"
      ].$post(
        {
          param: {
            courseId: courseId,
          },
          json: {
            filename: "test-file.pdf",
            fileType: "application/pdf",
            fileSize: 1024,
            pageNumberOffset: 0,
          },
        },
        {
          headers: getAuthHeaders(user2Cookie),
        }
      );

      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/protected/attachments/get-signed-url", () => {
    it("should return signed url for attachment upload", async () => {
      const res = await client.api.protected.attachments[
        "get-signed-url"
      ].$post(
        {
          json: {
            filename: "attachment.png",
            fileType: "image/png",
            fileSize: 1024,
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty("signedUrl");
      expect(data).toHaveProperty("newFilename");
    });
  });
});
