import { testClient } from "hono/testing";
import { describe, expect, it } from "vitest";
import app, { type ApiAppType } from "../../src/app.js";
import { getInternalAuthHeaders } from "../helpers/test-utils.js";

/**
 * Tests for internal API routes
 * These routes require the x-internal-secret header for authentication
 */

describe("Internal API Routes", () => {
  const client = testClient<ApiAppType>(app);

  describe("POST /api/internal/embeddings/single", () => {
    it("should return 401 without internal secret", async () => {
      const res = await client.api.internal.embeddings.single.$post({
        json: {
          text: "Test text for embedding",
        },
      });

      expect(res.status).toBe(401);
    });

    it("should return 401 with incorrect internal secret", async () => {
      const res = await client.api.internal.embeddings.single.$post(
        {
          json: {
            text: "Test text for embedding",
          },
        },
        {
          headers: {
            "x-internal-secret": "wrong-secret",
          },
        }
      );

      expect(res.status).toBe(401);
    });

    it("should generate single embedding with correct internal secret", async () => {
      const res = await client.api.internal.embeddings.single.$post(
        {
          json: {
            text: "Test text for embedding",
          },
        },
        {
          headers: getInternalAuthHeaders(),
        }
      );

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty("embedding");
      expect(Array.isArray(data.embedding)).toBe(true);
      expect(data.embedding.length).toBeGreaterThan(0);
    });

    it("should validate input schema", async () => {
      const res = await client.api.internal.embeddings.single.$post(
        {
          json: {
            // @ts-expect-error - Testing invalid input
            invalidField: "test",
          },
        },
        {
          headers: getInternalAuthHeaders(),
        }
      );

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/internal/embeddings/batch", () => {
    it("should return 401 without internal secret", async () => {
      const res = await client.api.internal.embeddings.batch.$post({
        json: {
          texts: ["Text 1", "Text 2", "Text 3"],
        },
      });

      expect(res.status).toBe(401);
    });

    it("should return 401 with incorrect internal secret", async () => {
      const res = await client.api.internal.embeddings.batch.$post(
        {
          json: {
            texts: ["Text 1", "Text 2", "Text 3"],
          },
        },
        {
          headers: {
            "x-internal-secret": "wrong-secret",
          },
        }
      );

      expect(res.status).toBe(401);
    });

    it("should generate batch embeddings with correct internal secret", async () => {
      const res = await client.api.internal.embeddings.batch.$post(
        {
          json: {
            texts: ["Text 1", "Text 2", "Text 3"],
          },
        },
        {
          headers: getInternalAuthHeaders(),
        }
      );

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty("embeddings");
      expect(Array.isArray(data.embeddings)).toBe(true);
      expect(data.embeddings.length).toBe(3);

      // Each embedding should be an array of numbers
      data.embeddings.forEach((embedding) => {
        expect(Array.isArray(embedding)).toBe(true);
        expect(embedding.length).toBeGreaterThan(0);
      });
    });

    it("should validate input schema for batch", async () => {
      const res = await client.api.internal.embeddings.batch.$post(
        {
          json: {
            // @ts-expect-error - Testing invalid input
            invalidField: "test",
          },
        },
        {
          headers: getInternalAuthHeaders(),
        }
      );

      expect(res.status).toBe(400);
    });

    it("should handle empty array", async () => {
      const res = await client.api.internal.embeddings.batch.$post(
        {
          json: {
            texts: [],
          },
        },
        {
          headers: getInternalAuthHeaders(),
        }
      );

      // Should return 400 due to validation
      expect(res.status).toBe(400);
    });
  });
});
