import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { type Filter } from "../src/schemas/filter-schema.js";
import {
  retrieveDocumentSources,
  retrieveEmbedding,
} from "../src/utils/retrieve-context.js";
import {
  cleanupTestPages,
  setupTestPages,
} from "./db/queries/config/pageUtils.js";

// Mock server-only module
vi.mock("server-only", () => {
  return {
    // mock server-only module
  };
});

let testEmbedding: number[];
let testData: {
  bucketId: string;
  courseIds: string[];
  fileIds: string[];
  pages: any[];
};

describe("retrieveDocumentSources Integration Tests", () => {
  beforeAll(async () => {
    // Generate embedding for testing
    testEmbedding = await retrieveEmbedding("What is Schrodinger's equation?");

    // Set up test data in the database
    testData = await setupTestPages();
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestPages(
      testData.bucketId,
      testData.courseIds,
      testData.fileIds
    );
  });

  it("should get sources using embedding", async () => {
    const filter: Filter = {
      bucketId: testData.bucketId,
      courses: [],
      files: [testData.fileIds[0]],
      documents: [],
    };

    const { documentSources } = await retrieveDocumentSources({
      filter,
      retrieveContent: true,
      embedding: testEmbedding,
      matchThreshold: -1,
    });

    expect(documentSources).toBeDefined();
    expect(Array.isArray(documentSources)).toBe(true);
    expect(documentSources.length).toBeGreaterThan(0);

    documentSources.forEach((src) => {
      expect(src.fileId).toBe(testData.fileIds[0]);
      expect(src.pageContent).toBeDefined();
    });
  });

  it("should get sources using ftsQuery", async () => {
    const filter: Filter = {
      bucketId: testData.bucketId,
      courses: [],
      files: [testData.fileIds[0]],
      documents: [],
    };

    const { documentSources } = await retrieveDocumentSources({
      filter,
      retrieveContent: true,
      ftsQuery: "quantum", // Matching content in the test pages
    });

    expect(documentSources).toBeDefined();
    expect(Array.isArray(documentSources)).toBe(true);
    expect(documentSources.length).toBeGreaterThan(0);

    documentSources.forEach((src) => {
      expect(src.fileId).toBe(testData.fileIds[0]);
      expect(src.pageContent).toBeDefined();
    });
  });

  it("should get sources using pageNumbers", async () => {
    // First get page numbers from test data
    const pageNumbers = testData.pages
      .map((page) => page.page_number)
      .filter(Boolean);

    if (pageNumbers.length === 0) {
      // If no page numbers in test data, we'll skip this test
      return;
    }

    const filter: Filter = {
      bucketId: testData.bucketId,
      courses: [],
      files: [],
      documents: [],
    };

    const { documentSources } = await retrieveDocumentSources({
      filter,
      retrieveContent: true,
      pageNumbers: pageNumbers,
    });

    expect(documentSources).toBeDefined();
    expect(Array.isArray(documentSources)).toBe(true);
    expect(documentSources.length).toBeGreaterThan(0);

    documentSources.forEach((src) => {
      expect(src.pageContent).toBeDefined();
    });
  });

  it("should combine results from multiple query methods and return unique sources", async () => {
    const filter: Filter = {
      bucketId: testData.bucketId,
      courses: [],
      files: testData.fileIds,
      documents: [],
    };

    // Use both embedding and text search
    const { documentSources } = await retrieveDocumentSources({
      filter,
      retrieveContent: true,
      embedding: testEmbedding,
      ftsQuery: "quantum", // Matching content in the test pages
    });

    expect(documentSources).toBeDefined();
    expect(Array.isArray(documentSources)).toBe(true);
    expect(documentSources.length).toBeGreaterThan(0);

    // Check uniqueness - no duplicated IDs
    const ids = documentSources.map((src) => src.id);
    const uniqueIds = [...new Set(ids)];
    expect(ids.length).toBe(uniqueIds.length);

    documentSources.forEach((src) => {
      expect(testData.fileIds).toContain(src.fileId);
      expect(src.pageContent).toBeDefined();
    });
  });

  it("should return empty array when no queries are provided", async () => {
    const filter: Filter = {
      bucketId: testData.bucketId,
      courses: [],
      files: [],
      documents: [],
    };

    const { documentSources } = await retrieveDocumentSources({
      filter,
      retrieveContent: true,
      // No embedding, ftsQuery, or pageNumbers
    });

    expect(documentSources).toBeDefined();
    expect(Array.isArray(documentSources)).toBe(true);
    expect(documentSources.length).toBe(0);
  });

  it("should return sources without content when retrieveContent is false", async () => {
    const filter: Filter = {
      bucketId: testData.bucketId,
      courses: [],
      files: [testData.fileIds[0]],
      documents: [],
    };

    const { documentSources } = await retrieveDocumentSources({
      filter,
      retrieveContent: false,
      embedding: testEmbedding,
      matchThreshold: -1,
    });

    expect(documentSources).toBeDefined();
    expect(Array.isArray(documentSources)).toBe(true);
    expect(documentSources.length).toBeGreaterThan(0);

    documentSources.forEach((src) => {
      expect(src.pageContent).toBeNull();
    });
  });
});
