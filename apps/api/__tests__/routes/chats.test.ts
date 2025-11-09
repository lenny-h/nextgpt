import { testClient } from "hono/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app, { type ApiAppType } from "../../src/app.js";
import {
  TEST_USERS,
  TEST_USER_IDS,
  getAuthHeaders,
  signInTestUser,
} from "../helpers/auth-helpers.js";
import { cleanupUserChats } from "../helpers/db-helpers.js";
import { generateTestUUID } from "../helpers/test-utils.js";

/**
 * Tests for /api/protected/chats routes
 * Tests authentication requirements and data isolation between users
 */

describe("Protected API Routes - Chats", () => {
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

  describe("GET /api/protected/chats", () => {
    it("should return 401 without authentication", async () => {
      const res = await client.api.protected.chats.$get({
        query: {
          pageNumber: "0",
          itemsPerPage: "10",
        },
      });

      expect(res.status).toBe(401);
    });

    it("should return chats with valid authentication", async () => {
      const res = await client.api.protected.chats.$get(
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

      // Each chat should have expected properties
      data.forEach((chat) => {
        expect(chat).toHaveProperty("id");
        expect(chat).toHaveProperty("userId");
        expect(chat).toHaveProperty("createdAt");
        // All chats should belong to user1
        expect(chat.userId).toBe(TEST_USERS.USER1_VERIFIED.id);
      });
    });

    it("should validate pagination parameters", async () => {
      // Invalid pageNumber
      const resInvalidPage = await client.api.protected.chats.$get(
        {
          query: {
            pageNumber: "invalid",
            itemsPerPage: "10",
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(resInvalidPage.status).toBe(400);

      // Invalid itemsPerPage
      const resInvalidItems = await client.api.protected.chats.$get(
        {
          query: {
            pageNumber: "0",
            itemsPerPage: "invalid",
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(resInvalidItems.status).toBe(400);
    });

    it("should isolate chats between users", async () => {
      const res1 = await client.api.protected.chats.$get(
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
      const user1Chats = await res1.json();

      const res2 = await client.api.protected.chats.$get(
        {
          query: {
            pageNumber: "0",
            itemsPerPage: "10",
          },
        },
        {
          headers: getAuthHeaders(user2Cookie),
        }
      );
      const user2Chats = await res2.json();

      // All user1 chats should belong to user1
      user1Chats.forEach((chat) => {
        expect(chat.userId).toBe(TEST_USERS.USER1_VERIFIED.id);
      });

      // All user2 chats should belong to user2
      user2Chats.forEach((chat) => {
        expect(chat.userId).toBe(TEST_USERS.USER2_VERIFIED.id);
      });

      // No chat IDs should overlap
      const user1ChatIds = user1Chats.map((c) => c.id);
      const user2ChatIds = user2Chats.map((c) => c.id);
      const overlap = user1ChatIds.filter((id: string) =>
        user2ChatIds.includes(id)
      );
      expect(overlap.length).toBe(0);
    });

    it("should respect pagination limits", async () => {
      const res = await client.api.protected.chats.$get(
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

      const data = await res.json();
      expect(data.length).toBeLessThanOrEqual(5);
    });
  });

  describe("GET /api/protected/chats/:chatId", () => {
    it("should return 401 without authentication", async () => {
      const testId = generateTestUUID();
      const res = await client.api.protected.chats[":chatId"].$get({
        param: {
          chatId: testId,
        },
      });

      expect(res.status).toBe(401);
    });

    it("should return 404 for non-existent chat", async () => {
      const nonExistentId = generateTestUUID();

      const res = await client.api.protected.chats[":chatId"].$get(
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

    it("should validate UUID format", async () => {
      const res = await client.api.protected.chats[":chatId"].$get(
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

    it("should not allow access to another user's chat", async () => {
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

        // Try to access user1's chat with user2's credentials
        const res = await client.api.protected.chats[":chatId"].$get(
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

    it("should return chat data for owner", async () => {
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

        // Access user1's chat with user1's credentials
        const res = await client.api.protected.chats[":chatId"].$get(
          {
            param: {
              chatId: user1ChatId,
            },
          },
          {
            headers: getAuthHeaders(user1Cookie),
          }
        );

        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data).toHaveProperty("chat");
        expect(data.chat.id).toBe(user1ChatId);
        expect(data.chat.userId).toBe(TEST_USERS.USER1_VERIFIED.id);
      }
    });
  });

  describe("DELETE /api/protected/chats/:chatId", () => {
    it("should return 401 without authentication", async () => {
      const testId = generateTestUUID();
      const res = await client.api.protected.chats[":chatId"].$delete({
        param: {
          chatId: testId,
        },
      });

      expect(res.status).toBe(401);
    });

    it("should return 404 when deleting non-existent chat", async () => {
      const nonExistentId = generateTestUUID();

      const res = await client.api.protected.chats[":chatId"].$delete(
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

    it("should validate UUID format", async () => {
      const res = await client.api.protected.chats[":chatId"].$delete(
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

    it("should not allow deleting another user's chat", async () => {
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

        // Try to delete user1's chat with user2's credentials
        const res = await client.api.protected.chats[":chatId"].$delete(
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

        // Verify the chat still exists for user1
        const verifyRes = await client.api.protected.chats[":chatId"].$get(
          {
            param: {
              chatId: user1ChatId,
            },
          },
          {
            headers: getAuthHeaders(user1Cookie),
          }
        );
        expect(verifyRes.status).toBe(200);
      }
    });
  });
});
