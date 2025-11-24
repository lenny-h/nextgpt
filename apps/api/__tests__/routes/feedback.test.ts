import { testClient } from "hono/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app, { type ApiAppType } from "../../src/app.js";
import {
  TEST_USERS,
  getAuthHeaders,
  signInTestUser,
  TEST_USER_IDS,
} from "../helpers/auth-helpers.js";
import { cleanupUserFeedback } from "../helpers/db-helpers.js";

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

  afterAll(async () => {
    // Clean up test data
    await cleanupUserFeedback(TEST_USER_IDS.USER1_VERIFIED);
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

      // We can't easily get the exact created date from the response or DB without a return value
      // But we can try to clean up based on approximate time if needed, or just rely on the fact that
      // feedback is less critical to clean up than other resources.
      // However, for completeness, let's assume we want to clean it up.
      // Since the API doesn't return the created record, we might need to query it.
      // For now, let's skip explicit tracking since we don't have the ID or exact timestamp easily available
      // and feedback is often append-only logs.
      // If we really needed to, we could query the DB for the latest feedback for this user.
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
