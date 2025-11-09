import { testClient } from "hono/testing";
import { beforeAll, describe, expect, it } from "vitest";
import app, { type ApiAppType } from "../../src/app.js";
import {
  TEST_USERS,
  getAuthHeaders,
  signInTestUser,
} from "../helpers/auth-helpers.js";
import { generateTestUUID } from "../helpers/test-utils.js";

// TODO: Improve

/**
 * Tests for /api/protected/search routes
 * Tests authentication requirements and search functionality
 */

describe("Protected API Routes - Search", () => {
  const client = testClient<ApiAppType>(app);

  let user1Cookie: string;

  // Create a sample filter for testing
  const createTestFilter = () => ({
    bucket: {
      id: generateTestUUID(),
    },
    courses: [],
    files: [],
    documents: [],
  });

  beforeAll(async () => {
    user1Cookie = await signInTestUser(
      TEST_USERS.USER1_VERIFIED.email,
      TEST_USERS.USER1_VERIFIED.password
    );
  });

  describe("POST /api/protected/search/:query", () => {
    it("should return 401 without authentication", async () => {
      const res = await client.api.protected.search[":query"].$post({
        param: {
          query: "test",
        },
        json: {
          filter: createTestFilter(),
          fts: false,
        },
      });

      expect(res.status).toBe(401);
    });

    it("should perform search with valid authentication", async () => {
      const res = await client.api.protected.search[":query"].$post(
        {
          param: {
            query: "test",
          },
          json: {
            filter: createTestFilter(),
            fts: false,
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      // May return 200 or 403 depending on permissions
      expect([200, 403]).toContain(res.status);

      if (res.status === 200) {
        const data = await res.json();
        expect(Array.isArray(data)).toBe(true);
      }
    });

    it("should validate query length (too short)", async () => {
      const res = await client.api.protected.search[":query"].$post(
        {
          param: {
            query: "ab", // Less than 3 characters
          },
          json: {
            filter: createTestFilter(),
            fts: false,
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(400);
    });

    it("should handle FTS search mode", async () => {
      const res = await client.api.protected.search[":query"].$post(
        {
          param: {
            query: "test query",
          },
          json: {
            filter: createTestFilter(),
            fts: true,
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      // May return 200 or 403 depending on permissions
      expect([200, 403]).toContain(res.status);
    });

    it("should validate filter schema", async () => {
      const res = await client.api.protected.search[":query"].$post(
        {
          param: {
            query: "test",
          },
          json: {
            filter: {
              bucket: {
                id: "not-a-uuid", // Invalid UUID
              },
              courses: [],
              files: [],
              documents: [],
            },
            fts: false,
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
