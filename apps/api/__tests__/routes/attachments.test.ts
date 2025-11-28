import { testClient } from "hono/testing";
import { beforeAll, describe, expect, it } from "vitest";
import app, { type ApiAppType } from "../../src/app.js";
import {
  TEST_USERS,
  getAuthHeaders,
  signInTestUser,
} from "../helpers/auth-helpers.js";

/**
 * Tests for /api/protected/attachments/get-signed-url route
 * Tests authentication requirements and signed URL generation for temporary attachments
 */

describe("Protected API Routes - Attachments", () => {
  const client = testClient<ApiAppType>(app);

  let user1Cookie: string;

  beforeAll(async () => {
    user1Cookie = await signInTestUser(
      TEST_USERS.USER1_VERIFIED.email,
      TEST_USERS.USER1_VERIFIED.password
    );
  });

  describe("POST /api/protected/attachments/get-signed-url", () => {
    it("should return 401 without authentication", async () => {
      const res = await client.api.protected.attachments[
        "get-signed-url"
      ].$post({
        json: {
          filename: "test-attachment.pdf",
          fileSize: 1000,
          fileType: "application/pdf",
        },
      });

      expect(res.status).toBe(401);
    });

    it("should return signed URL with valid authentication", async () => {
      const res = await client.api.protected.attachments[
        "get-signed-url"
      ].$post(
        {
          json: {
            filename: "test.pdf",
            fileSize: 1000,
            fileType: "application/pdf",
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty("signedUrl");
      expect(data).toHaveProperty("headers");
      expect(data).toHaveProperty("newFilename");

      expect(typeof data.signedUrl).toBe("string");
      expect(typeof data.newFilename).toBe("string");
      expect(data.newFilename).toContain(TEST_USERS.USER1_VERIFIED.id);
    });

    it("should validate request body schema", async () => {
      const res = await client.api.protected.attachments[
        "get-signed-url"
      ].$post(
        {
          json: {
            filename: "test.pdf",
            fileSize: 1000,
            fileType: "some-type",
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(400);
    });

    it("should handle different file types", async () => {
      const fileTypes = ["application/pdf", "image/png", "image/jpeg"];

      for (const fileType of fileTypes) {
        const res = await client.api.protected.attachments[
          "get-signed-url"
        ].$post(
          {
            json: {
              filename: `test-file.${fileType.split("/")[1]}`,
              fileSize: 1000,
              fileType,
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
      }
    });

    it("should include user ID in new filename", async () => {
      const res = await client.api.protected.attachments[
        "get-signed-url"
      ].$post(
        {
          json: {
            filename: "my-attachment.pdf",
            fileSize: 1000,
            fileType: "application/pdf",
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.newFilename).toMatch(
        new RegExp(`^${TEST_USERS.USER1_VERIFIED.id}/`)
      );
      expect(data.newFilename).toContain("my-attachment.pdf");
    });

    it("should handle filenames with special characters", async () => {
      const specialFilenames = [
        "test file with spaces.pdf",
        "test-file-with-dashes.pdf",
        "test_file_with_underscores.pdf",
        "test.multiple.dots.pdf",
      ];

      for (const filename of specialFilenames) {
        const res = await client.api.protected.attachments[
          "get-signed-url"
        ].$post(
          {
            json: {
              filename,
              fileSize: 1000,
              fileType: "application/pdf",
            },
          },
          {
            headers: getAuthHeaders(user1Cookie),
          }
        );

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.newFilename).toContain(filename);
      }
    });
  });
});
