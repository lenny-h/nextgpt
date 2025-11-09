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
 * Tests for /api/protected/chats favorites routes
 * Tests authentication requirements and favorites operations
 */

describe("Protected API Routes - Chat Favorites", () => {
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

  describe("GET /api/protected/chats/favourites", () => {
    it("should return 401 without authentication", async () => {
      const res = await client.api.protected.chats.favourites.$get({
        query: {
          pageNumber: "0",
          itemsPerPage: "10",
        },
      });

      expect(res.status).toBe(401);
    });

    it("should return favorites with valid authentication", async () => {
      const res = await client.api.protected.chats.favourites.$get(
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

    it("should validate pagination parameters", async () => {
      const res = await client.api.protected.chats.favourites.$get(
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

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/protected/chats/is-favourite/:chatId", () => {
    it("should return 401 without authentication", async () => {
      const testId = generateTestUUID();
      const res = await client.api.protected.chats["is-favourite"][
        ":chatId"
      ].$get({
        param: {
          chatId: testId,
        },
      });

      expect(res.status).toBe(401);
    });

    it("should validate UUID format", async () => {
      const res = await client.api.protected.chats["is-favourite"][
        ":chatId"
      ].$get(
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

    it("should return favorite status for existing chat", async () => {
      // Get user1's chats first
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
        const chatId = user1Chats[0].id;

        const res = await client.api.protected.chats["is-favourite"][
          ":chatId"
        ].$get(
          {
            param: {
              chatId,
            },
          },
          {
            headers: getAuthHeaders(user1Cookie),
          }
        );

        expect(res.status).toBe(200);

        const data = await res.json();
        expect(data).toHaveProperty("isFavourite");
        expect(typeof data.isFavourite).toBe("boolean");
      }
    });
  });

  describe("GET /api/protected/chats/ilike", () => {
    it("should return 401 without authentication", async () => {
      const res = await client.api.protected.chats.ilike.$get({
        query: {
          prefix: "test",
        },
      });

      expect(res.status).toBe(401);
    });

    it("should search chats with valid query", async () => {
      const res = await client.api.protected.chats.ilike.$get(
        {
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

    it("should validate input schema", async () => {
      const res = await client.api.protected.chats.ilike.$get(
        {
          // @ts-expect-error - Testing missing required fields
          query: {},
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/protected/chats/title/:chatId", () => {
    it("should return 401 without authentication", async () => {
      const testId = generateTestUUID();
      const res = await client.api.protected.chats.title[":chatId"].$patch({
        param: {
          chatId: testId,
        },
        json: {
          title: "New Title",
        },
      });

      expect(res.status).toBe(401);
    });

    it("should validate UUID format", async () => {
      const res = await client.api.protected.chats.title[":chatId"].$patch(
        {
          param: {
            chatId: "not-a-uuid",
          },
          json: {
            title: "New Title",
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(400);
    });

    it("should validate input schema", async () => {
      const res = await client.api.protected.chats.title[":chatId"].$patch(
        {
          param: {
            chatId: generateTestUUID(),
          },
          // @ts-expect-error - Testing missing required fields
          json: {},
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(400);
    });
  });
});
