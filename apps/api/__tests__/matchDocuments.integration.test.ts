import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { matchDocuments } from "../src/lib/db/queries/pages.js";
import { type Filter } from "../src/schemas/filter-schema.js";
import { retrieveEmbedding } from "../src/utils/retrieve-context.js";
import {
  cleanupTestPages,
  setupTestPages,
} from "./db/queries/config/pageUtils.js";

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

describe("Embedding Generation", () => {
  it("should generate embeddings from text", async () => {
    const text = "What is Schrodinger's equation?";
    const embedding = await retrieveEmbedding(text);

    testEmbedding = embedding;

    // Verify the embedding is an array of numbers with expected length
    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBe(768);

    return embedding;
  });
});

describe("matchDocuments Integration", () => {
  beforeAll(async () => {
    // Use the stored embedding or generate a new one if needed
    if (!testEmbedding) {
      testEmbedding = await retrieveEmbedding(
        "What is Schrodinger's equation?"
      );
    }

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

  it("should find documents filtered by fileIds", async () => {
    const filter: Filter = {
      bucketId: testData.bucketId,
      courses: [],
      files: [testData.fileIds[0]],
      documents: [],
    };

    const results = await matchDocuments({
      queryEmbedding: testEmbedding,
      filter,
      matchThreshold: -1,
      matchCount: 10,
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((doc) => doc.fileId === testData.fileIds[0])).toBe(
      true
    );
  });

  it("should find documents filtered by courseIds", async () => {
    const filter: Filter = {
      bucketId: testData.bucketId,
      courses: [testData.courseIds[0]],
      files: [],
      documents: [],
    };

    const results = await matchDocuments({
      queryEmbedding: testEmbedding,
      filter,
      matchThreshold: -1,
      matchCount: 10,
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((doc) => doc.courseId === testData.courseIds[0])).toBe(
      true
    );
  });

  it("should limit results based on matchCount", async () => {
    const filter: Filter = {
      bucketId: testData.bucketId,
      courses: testData.courseIds,
      files: [],
      documents: [],
    };

    const results = await matchDocuments({
      queryEmbedding: testEmbedding,
      filter,
      matchThreshold: -1,
      matchCount: 1,
    });

    expect(results.length).toBeLessThanOrEqual(1);
  });

  it("should filter results based on similarity threshold", async () => {
    const filter: Filter = {
      bucketId: testData.bucketId,
      courses: testData.courseIds,
      files: [],
      documents: [],
    };

    // Use a very high threshold that should exclude all results
    const results = await matchDocuments({
      queryEmbedding: testEmbedding,
      filter,
      matchThreshold: 0.99, // High threshold
      matchCount: 10,
    });

    expect(results.length).toBe(0);
  });
});
