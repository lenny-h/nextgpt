import { testClient } from "hono/testing";
import { beforeAll, describe, expect, it } from "vitest";
import app, { type ApiAppType } from "../../src/app.js";
import {
  TEST_USERS,
  getAuthHeaders,
  signInTestUser,
} from "../helpers/auth-helpers.js";

/**
 * Tests for /api/protected/feedback routes
 * Tests authentication requirements and feedback submission
 */

describe("Protected API Routes - Feedback", () => {
  const client = testClient<ApiAppType>(app);

  let user1Cookie: string;

  beforeAll(async () => {
    user1Cookie = await signInTestUser(
      TEST_USERS.USER1_VERIFIED.email,
      TEST_USERS.USER1_VERIFIED.password
    );
  });

  describe("POST /api/protected/feedback", () => {
    it("should return 401 without authentication", async () => {
      const res = await client.api.protected.feedback.$post({
        json: {
          subject: "Test Subject",
          content: "Test content for feedback",
        },
      });

      expect(res.status).toBe(401);
    });

    it("should submit feedback with valid authentication", async () => {
      const feedbackData = {
        subject: "Test Feedback Subject",
        content: "This is test content from the test suite",
      };

      const res = await client.api.protected.feedback.$post(
        {
          json: feedbackData,
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty("message");
    });

    it("should validate input schema", async () => {
      const res = await client.api.protected.feedback.$post(
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

    it("should validate feedback length", async () => {
      const res = await client.api.protected.feedback.$post(
        {
          json: {
            subject: "Hi",
            content: "Ok",
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
