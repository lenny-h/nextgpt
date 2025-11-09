import { testClient } from "hono/testing";
import { describe, expect, it } from "vitest";
import app, { type ApiAppType } from "../../src/app.js";

/**
 * Tests for unprotected/public API routes
 * These routes should be accessible without authentication
 */

describe("Unprotected API Routes", () => {
  const client = testClient<ApiAppType>(app);

  describe("GET /api/public/health", () => {
    it("should return health status without authentication", async () => {
      const res = await client.api.public.health.$get();

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty("message");
      expect(data.message).toBe("API is running");
      expect(data).toHaveProperty("timestamp");
    });

    it("should return valid ISO timestamp", async () => {
      const res = await client.api.public.health.$get();
      const data = await res.json();

      // Verify timestamp is a valid ISO string
      const timestamp = new Date(data.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.toISOString()).toBe(data.timestamp);
    });
  });

  describe("GET / (root)", () => {
    it("should return API information without authentication", async () => {
      // Using fetch directly for root route since it's not part of the typed client
      const res = await app.request("/");

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toEqual({
        name: "NextGPT API",
        version: "1.0.0",
        status: "Running",
      });
    });
  });
});
