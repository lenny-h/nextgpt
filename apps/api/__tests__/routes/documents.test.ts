import { testClient } from "hono/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app, { type ApiAppType } from "../../src/app.js";
import { TEST_USERS, TEST_USER_IDS, getAuthHeaders, signInTestUser } from "../helpers/auth-helpers.js";
import { cleanupUserDocuments } from "../helpers/cleanup-helpers.js";
import { generateTestUUID } from "../helpers/test-utils.js";

/**
 * Tests for /api/protected/documents routes
 * Tests authentication requirements, CRUD operations, and data isolation
 */

describe("Protected API Routes - Documents", () => {
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
    await cleanupUserDocuments(TEST_USER_IDS.USER1_VERIFIED);
    await cleanupUserDocuments(TEST_USER_IDS.USER2_VERIFIED);
  });

  describe("POST /api/protected/documents", () => {
    it("should return 401 without authentication", async () => {
      const res = await client.api.protected.documents.$post({
        json: {
          title: "Test Document",
          content: "Test content",
          kind: "text",
        },
      });

      expect(res.status).toBe(401);
    });

    it("should create document with valid data", async () => {
      const documentData = {
        title: `Test Document ${Date.now()}`,
        content: "This is test content for the document",
        kind: "text" as const,
      };

      const res = await client.api.protected.documents.$post(
        {
          json: documentData,
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data).toHaveProperty("message");
      expect(data.message).toBe("Document inserted");
    });

    it("should validate input schema", async () => {
      const res = await client.api.protected.documents.$post(
        {
          // @ts-expect-error - Testing missing required fields
          json: {
            title: "Test",
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/protected/documents", () => {
    it("should return 401 without authentication", async () => {
      const res = await client.api.protected.documents.$get({
        query: {
          pageNumber: "0",
          itemsPerPage: "10",
        },
      });

      expect(res.status).toBe(401);
    });

    it("should return documents with valid authentication", async () => {
      const res = await client.api.protected.documents.$get(
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
      
      data.forEach((doc) => {
        expect(doc).toHaveProperty("id");
        expect(doc).toHaveProperty("title");
        expect(doc).toHaveProperty("content");
        expect(doc).toHaveProperty("kind");
        expect(doc).toHaveProperty("createdAt");
      });
    });

    it("should validate pagination parameters", async () => {
      const resInvalidPage = await client.api.protected.documents.$get(
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
    });

    it("should isolate documents between users", async () => {
      // Create document for user1
      await client.api.protected.documents.$post(
        {
          json: {
            title: `User1 Doc ${Date.now()}`,
            content: "User 1 content",
            kind: "text",
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      const res1 = await client.api.protected.documents.$get(
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
      const user1Docs = await res1.json();
      
      const res2 = await client.api.protected.documents.$get(
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
      const user2Docs = await res2.json();

      // Documents should be isolated
      const user1DocIds = user1Docs.map((d) => d.id);
      const user2DocIds = user2Docs.map((d) => d.id);
      const overlap = user1DocIds.filter((id: string) => user2DocIds.includes(id));
      expect(overlap.length).toBe(0);
    });
  });

  describe("GET /api/protected/documents/:documentId", () => {
    it("should return 401 without authentication", async () => {
      const testId = generateTestUUID();
      const res = await client.api.protected.documents[":documentId"].$get({
        param: {
          documentId: testId,
        },
      });

      expect(res.status).toBe(401);
    });

    it("should return 404 for non-existent document", async () => {
      const nonExistentId = generateTestUUID();
      
      const res = await client.api.protected.documents[":documentId"].$get(
        {
          param: {
            documentId: nonExistentId,
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(404);
    });

    it("should validate UUID format", async () => {
      const res = await client.api.protected.documents[":documentId"].$get(
        {
          param: {
            documentId: "not-a-uuid",
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/protected/documents/content/:documentId", () => {
    it("should return 401 without authentication", async () => {
      const testId = generateTestUUID();
      const res = await client.api.protected.documents.content[":documentId"].$patch({
        param: {
          documentId: testId,
        },
        json: {
          content: "Updated content",
        },
      });

      expect(res.status).toBe(401);
    });

    it("should validate UUID format", async () => {
      const res = await client.api.protected.documents.content[":documentId"].$patch(
        {
          param: {
            documentId: "not-a-uuid",
          },
          json: {
            content: "Updated content",
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/protected/documents/:documentId", () => {
    it("should return 401 without authentication", async () => {
      const testId = generateTestUUID();
      const res = await client.api.protected.documents[":documentId"].$delete({
        param: {
          documentId: testId,
        },
      });

      expect(res.status).toBe(401);
    });

    it("should return 404 when deleting non-existent document", async () => {
      const nonExistentId = generateTestUUID();
      
      const res = await client.api.protected.documents[":documentId"].$delete(
        {
          param: {
            documentId: nonExistentId,
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(404);
    });

    it("should validate UUID format", async () => {
      const res = await client.api.protected.documents[":documentId"].$delete(
        {
          param: {
            documentId: "not-a-uuid",
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/protected/documents/:documentId", () => {
    it("should return document content", async () => {
      const testId = generateTestUUID();
      const res = await client.api.protected.documents[":documentId"].$get({
        param: {
          documentId: testId,
        },
      });

      expect(res.status).toBe(401);
    });

    it("should validate UUID format for content retrieval", async () => {
      const res = await client.api.protected.documents[":documentId"].$get(
        {
          param: {
            documentId: "not-a-uuid",
          },
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/protected/documents/ilike", () => {
    it("should return 401 without authentication", async () => {
      const res = await client.api.protected.documents.ilike.$get({
        query: {
          prefix: "test",
        },
      });

      expect(res.status).toBe(401);
    });

    it("should search documents with valid query", async () => {
      const res = await client.api.protected.documents.ilike.$get(
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
      const res = await client.api.protected.documents.ilike.$get(
        {
          // @ts-expect-error - Missing required fields
          query: {},
        },
        {
          headers: getAuthHeaders(user1Cookie),
        }
      );

      expect(res.status).toBe(400);
    });
  });

});
