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
  cleanupUserBucket,
  createTestBucket,
  createTestUserInvitation,
} from "../helpers/db-helpers.js";
import { generateTestUUID } from "../helpers/test-utils.js";

/**
 * Tests for /api/protected/invitations routes
 * Tests authentication requirements and invitation operations
 */

describe("Protected API Routes - Invitations", () => {
  const client = testClient<ApiAppType>(app);

  let user1Cookie: string;
  let user2Cookie: string;
  let bucketId: string;

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
    await createTestUserInvitation(
      TEST_USER_IDS.USER1_VERIFIED,
      TEST_USER_IDS.USER2_VERIFIED,
      bucketId
    );
  });

  afterAll(async () => {
    await cleanupUserBucket(bucketId);
  });

  describe("GET /api/protected/invitations/incoming", () => {
    it("should return 401 without authentication", async () => {
      const res = await client.api.protected.invitations.incoming.$get({
        query: {
          pageNumber: "0",
          itemsPerPage: "10",
          invitationType: "user",
        },
      });
      expect(res.status).toBe(401);
    });

    it("should return incoming invitations with authentication", async () => {
      const res = await client.api.protected.invitations.incoming.$get(
        {
          query: {
            pageNumber: "0",
            itemsPerPage: "10",
            invitationType: "user",
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

  describe("GET /api/protected/invitations/outgoing", () => {
    it("should return 401 without authentication", async () => {
      const res = await client.api.protected.invitations.outgoing.$get({
        query: {
          pageNumber: "0",
          itemsPerPage: "10",
          invitationType: "user",
        },
      });
      expect(res.status).toBe(401);
    });

    it("should return outgoing invitations with authentication", async () => {
      const res = await client.api.protected.invitations.outgoing.$get(
        {
          query: {
            pageNumber: "0",
            itemsPerPage: "10",
            invitationType: "user",
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

  describe("POST /api/protected/invitations/accept", () => {
    it("should return 401 without authentication", async () => {
      const res = await client.api.protected.invitations.accept.$post({
        json: {
          type: "user",
          originUserId: generateTestUUID(),
          resourceId: generateTestUUID(),
        },
      });

      expect(res.status).toBe(401);
    });

    it("should validate input schema", async () => {
      const res = await client.api.protected.invitations.accept.$post(
        {
          // @ts-expect-error - Testing missing required fields
          json: {},
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(400);
    });

    it("should validate UUID format", async () => {
      const res = await client.api.protected.invitations.accept.$post(
        {
          json: {
            type: "user",
            originUserId: "not-a-uuid",
            resourceId: generateTestUUID(),
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/protected/invitations/reject", () => {
    it("should return 401 without authentication", async () => {
      const res = await client.api.protected.invitations.reject.$post({
        json: {
          type: "user",
          originUserId: generateTestUUID(),
          resourceId: generateTestUUID(),
        },
      });

      expect(res.status).toBe(401);
    });

    it("should validate input schema", async () => {
      const res = await client.api.protected.invitations.reject.$post(
        {
          // @ts-expect-error - Testing missing required fields
          json: {},
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(400);
    });

    it("should validate UUID format", async () => {
      const res = await client.api.protected.invitations.reject.$post(
        {
          json: {
            type: "user",
            originUserId: "not-a-uuid",
            resourceId: generateTestUUID(),
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
