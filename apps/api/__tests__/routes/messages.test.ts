import { testClient } from "hono/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app, { type ApiAppType } from "../../src/app.js";
import {
  TEST_USERS,
  TEST_USER_IDS,
  getAuthHeaders,
  signInTestUser,
} from "../helpers/auth-helpers.js";
import { cleanupUserChats } from "../helpers/cleanup-helpers.js";
import { generateTestUUID } from "../helpers/test-utils.js";

/**
 * Tests for /api/protected/messages routes
 * Tests authentication requirements and message operations
 */

describe("Protected API Routes - Messages", () => {
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
    await cleanupUserChats(TEST_USER_IDS.USER1_VERIFIED);
    await cleanupUserChats(TEST_USER_IDS.USER2_VERIFIED);
  });

  describe("GET /api/protected/messages/:chatId", () => {
    it("should return 401 without authentication", async () => {
      const testId = generateTestUUID();
      const res = await client.api.protected.messages[":chatId"].$get({
        param: {
          chatId: testId,
        },
      });

      expect(res.status).toBe(401);
    });

    it("should validate UUID format", async () => {
      const res = await client.api.protected.messages[":chatId"].$get(
        {
          param: {
            chatId: "not-a-uuid",
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(400);
    });

    it("should return 404 for non-existent chat", async () => {
      const nonExistentId = generateTestUUID();

      const res = await client.api.protected.messages[":chatId"].$get(
        {
          param: {
            chatId: nonExistentId,
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(404);
    });

    it("should not allow access to another user's chat messages", async () => {
      // Get user1's chats
      const chatsRes = await client.api.protected.chats.$get(
        {
          query: {
            pageNumber: "0",
            itemsPerPage: "5",
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );
      const user1Chats = await chatsRes.json();

      if (user1Chats.length > 0) {
        const user1ChatId = user1Chats[0].id;

        // Try to access user1's messages with user2's credentials
        const res = await client.api.protected.messages[":chatId"].$get(
          {
            param: {
              chatId: user1ChatId,
            },
          },
          {
            headers: getAuthHeaders(user2Cookie),
          }
        );

        // Should return 404 (not revealing the chat exists)
        expect(res.status).toBe(404);
      }
    });
  });

  describe("DELETE /api/protected/messages/delete-trailing/:messageId", () => {
    it("should return 401 without authentication", async () => {
      const testId = generateTestUUID();
      const res = await client.api.protected.messages["delete-trailing"][
        ":messageId"
      ].$delete({
        param: {
          messageId: testId,
        },
      });

      expect(res.status).toBe(401);
    });

    it("should validate UUID format", async () => {
      const res = await client.api.protected.messages["delete-trailing"][
        ":messageId"
      ].$delete(
        {
          param: {
            messageId: "not-a-uuid",
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(400);
    });

    it("should return 404 when deleting non-existent message", async () => {
      const nonExistentId = generateTestUUID();

      const res = await client.api.protected.messages["delete-trailing"][
        ":messageId"
      ].$delete(
        {
          param: {
            messageId: nonExistentId,
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(404);
    });
  });
});
