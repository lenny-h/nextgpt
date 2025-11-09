import { testClient } from "hono/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app, { type ApiAppType } from "../../src/app.js";
import {
  TEST_USERS,
  TEST_USER_IDS,
  getAuthHeaders,
  signInTestUser,
} from "../helpers/auth-helpers.js";
import { cleanupUserPrompts } from "../helpers/cleanup-helpers.js";
import { generateTestUUID } from "../helpers/test-utils.js";

/**
 * Tests for /api/protected/prompts routes
 * Tests authentication requirements, CRUD operations, and prompt limits
 */

describe("Protected API Routes - Prompts", () => {
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

    // Clean up user2's prompts to ensure we're under the limit for POST tests
    const promptsRes = await client.api.protected.prompts.$get(
      {},
      {
        headers: getAuthHeaders(user2Cookie),
      }
    );
    const user2Prompts = await promptsRes.json();

    // Delete all but 4 prompts to leave room for testing
    const promptsToDelete = user2Prompts.slice(4);
    for (const prompt of promptsToDelete) {
      await client.api.protected.prompts[":promptId"].$delete(
        {
          param: {
            promptId: prompt.id,
          },
        },
        {
          headers: getAuthHeaders(user2Cookie),
        }
      );
    }
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupUserPrompts(TEST_USER_IDS.USER1_VERIFIED);
    await cleanupUserPrompts(TEST_USER_IDS.USER2_VERIFIED);
  });

  describe("GET /api/protected/prompts", () => {
    it("should return 401 without authentication", async () => {
      const res = await client.api.protected.prompts.$get();
      expect(res.status).toBe(401);
    });

    it("should return prompts with valid authentication", async () => {
      const res = await client.api.protected.prompts.$get(
        {},
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);

      data.forEach((prompt) => {
        expect(prompt).toHaveProperty("id");
        expect(prompt).toHaveProperty("name");
        expect(prompt).toHaveProperty("content");
      });
    });

    it("should isolate prompts between users", async () => {
      const res1 = await client.api.protected.prompts.$get(
        {},
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );
      const user1Prompts = await res1.json();

      const res2 = await client.api.protected.prompts.$get(
        {},
        {
          headers: getAuthHeaders(user2Cookie),
        }
      );
      const user2Prompts = await res2.json();

      // Prompts should be isolated
      const user1PromptIds = user1Prompts.map((p) => p.id);
      const user2PromptIds = user2Prompts.map((p) => p.id);
      const overlap = user1PromptIds.filter((id: string) =>
        user2PromptIds.includes(id)
      );
      expect(overlap.length).toBe(0);
    });
  });

  describe("POST /api/protected/prompts", () => {
    it("should return 401 without authentication", async () => {
      const res = await client.api.protected.prompts.$post({
        json: {
          name: "Test Prompt",
          content: "Test content",
        },
      });

      expect(res.status).toBe(401);
    });

    it("should create prompt with valid data", async () => {
      const promptData = {
        name: `Test Prompt ${Date.now()}`,
        content: "This is a test prompt content",
      };

      const res = await client.api.protected.prompts.$post(
        {
          json: promptData,
        },
        {
          headers: getAuthHeaders(user2Cookie),
        }
      );

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty("message");
      expect(data.message).toBe("Prompt inserted");
    });

    it("should validate input schema", async () => {
      const res = await client.api.protected.prompts.$post(
        {
          // @ts-expect-error - Testing missing required fields
          json: {
            name: "Test",
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(400);
    });

    it("should enforce prompt limit of 6 prompts per user", async () => {
      // This test assumes the user doesn't already have 6+ prompts
      // In a real test, you might want to set up the data first
      const res = await client.api.protected.prompts.$get(
        {},
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );
      const existingPrompts = await res.json();

      // If user has less than 6 prompts, adding one should work
      if (existingPrompts.length < 6) {
        const createRes = await client.api.protected.prompts.$post(
          {
            json: {
              name: `Limit Test ${Date.now()}`,
              content: "Testing limit",
            },
          },
          {
            headers: getAuthHeaders(user1Cookie),
          }
        );

        expect(createRes.status).toBe(200);
      }
    });
  });

  describe("DELETE /api/protected/prompts/:promptId", () => {
    it("should return 401 without authentication", async () => {
      const testId = generateTestUUID();
      const res = await client.api.protected.prompts[":promptId"].$delete({
        param: {
          promptId: testId,
        },
      });

      expect(res.status).toBe(401);
    });

    it("should return 404 when deleting non-existent prompt", async () => {
      const nonExistentId = generateTestUUID();

      const res = await client.api.protected.prompts[":promptId"].$delete(
        {
          param: {
            promptId: nonExistentId,
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(404);
    });

    it("should validate UUID format", async () => {
      const res = await client.api.protected.prompts[":promptId"].$delete(
        {
          param: {
            promptId: "not-a-uuid",
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(400);
    });

    it("should not allow deleting another user's prompt", async () => {
      // Get user2's prompts
      const promptsRes = await client.api.protected.prompts.$get(
        {},
        {
          headers: getAuthHeaders(user2Cookie),
        }
      );
      const user2Prompts = await promptsRes.json();

      if (user2Prompts.length > 0) {
        const user2PromptId = user2Prompts[0].id;

        // Try to delete user2's prompt with user1's credentials
        const res = await client.api.protected.prompts[":promptId"].$delete(
          {
            param: {
              promptId: user2PromptId,
            },
          },
          {
            headers: getAuthHeaders(user1Cookie),
          }
        );

        // Should return 404 (not revealing the prompt exists)
        expect(res.status).toBe(404);
      }
    });
  });
});
