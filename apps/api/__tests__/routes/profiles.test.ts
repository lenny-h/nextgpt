import { testClient } from "hono/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app, { type ApiAppType } from "../../src/app.js";
import {
  TEST_USERS,
  getAuthHeaders,
  signInTestUser,
} from "../helpers/auth-helpers.js";

describe("Protected API Routes - Profiles", () => {
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
    // Reset user1 profile
    await client.api.protected.profiles.$patch(
      {
        json: {
          name: TEST_USERS.USER1_VERIFIED.name,
          username: TEST_USERS.USER1_VERIFIED.username,
          isPublic: false, // Assuming default is false or we want to reset to a known state
        },
      },
      {
        headers: getAuthHeaders(user1Cookie),
      }
    );
  });

  describe("GET /api/protected/profiles", () => {
    it("should return 401 without authentication", async () => {
      const res = await client.api.protected.profiles.$get();
      expect(res.status).toBe(401);
    });

    it("should return user profile with authentication", async () => {
      const res = await client.api.protected.profiles.$get(
        {},
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty("username");
      expect(data).toHaveProperty("name");
      expect(data).toHaveProperty("isPublic");
      expect(data.username).toBe(TEST_USERS.USER1_VERIFIED.username);
    });

    it("should return different profiles for different users", async () => {
      const res1 = await client.api.protected.profiles.$get(
        {},
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );
      const user1Data = await res1.json();

      const res2 = await client.api.protected.profiles.$get(
        {},
        {
          headers: getAuthHeaders(user2Cookie),
        }
      );
      const user2Data = await res2.json();

      expect(user1Data.username).toBe(TEST_USERS.USER1_VERIFIED.username);
      expect(user2Data.username).toBe(TEST_USERS.USER2_VERIFIED.username);
      expect(user1Data.username).not.toBe(user2Data.username);
    });
  });

  describe("PATCH /api/protected/profiles", () => {
    it("should return 401 without authentication", async () => {
      const res = await client.api.protected.profiles.$patch({
        json: {
          name: "Updated Name",
          username: "updateduser",
          isPublic: true,
        },
      });

      expect(res.status).toBe(401);
    });

    it("should update profile with valid data", async () => {
      const updateData = {
        name: "Updated Test User",
        username: TEST_USERS.USER1_VERIFIED.username, // Keep same username
        isPublic: true,
      };

      const res = await client.api.protected.profiles.$patch(
        {
          json: updateData,
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty("message");
      expect(data.message).toBe("Profile updated");

      // Verify the update by fetching the profile
      const getRes = await client.api.protected.profiles.$get(
        {},
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );
      const profile = await getRes.json();
      expect(profile.name).toBe(updateData.name);
      expect(profile.isPublic).toBe(updateData.isPublic);
    });

    it("should validate input schema", async () => {
      const res = await client.api.protected.profiles.$patch(
        {
          json: {
            // @ts-expect-error - Testing invalid input
            invalidField: "test",
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(400);
    });

    it("should not allow updating another user's profile", async () => {
      // Update user1's profile
      const updateData = {
        name: "User 1 Updated",
        username: TEST_USERS.USER1_VERIFIED.username,
        isPublic: false,
      };

      await client.api.protected.profiles.$patch(
        {
          json: updateData,
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      // Check that user2's profile is unchanged
      const res2 = await client.api.protected.profiles.$get(
        {},
        {
          headers: getAuthHeaders(user2Cookie),
        }
      );
      const user2Profile = await res2.json();

      // User2's name should still be their original name
      expect(user2Profile.name).toBe(TEST_USERS.USER2_VERIFIED.name);
      expect(user2Profile.username).toBe(TEST_USERS.USER2_VERIFIED.username);
    });
  });
});
