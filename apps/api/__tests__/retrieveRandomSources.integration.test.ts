import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { retrieveRandomSources } from "../src/lib/db/queries/pages.js";
import { type PracticeFilter } from "../src/schemas/practice-filter-schema.js";
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

let testData: {
  bucketId: string;
  courseIds: string[];
  fileIds: string[];
  pages: any[];
};

describe("getRandomSources Integration Tests", () => {
  beforeAll(async () => {
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

  it("should get random sources from files without chapters", async () => {
    const filter: PracticeFilter = {
      bucketId: testData.bucketId,
      courses: [],
      files: [
        { id: testData.fileIds[0], chapters: [] },
        { id: testData.fileIds[1], chapters: [] },
      ],
      studyMode: "concepts",
    };

    const sources = await retrieveRandomSources({ filter });

    expect(sources).toBeDefined();
    expect(Array.isArray(sources)).toBe(true);
    expect(sources.length).toBeGreaterThan(0);

    sources.forEach((source) => {
      // Verify sources come from the specified files
      expect(filter.files.map((f) => f.id)).toContain(source.fileId);
    });
  });

  it("should get random sources from files with chapters", async () => {
    const filter: PracticeFilter = {
      bucketId: testData.bucketId,
      courses: [],
      files: [
        {
          id: testData.fileIds[1],
          chapters: [3],
        },
      ],
      studyMode: "concepts",
    };

    const sources = await retrieveRandomSources({ filter });

    expect(sources).toBeDefined();
    expect(Array.isArray(sources)).toBe(true);
    expect(sources.length).toBeGreaterThan(0);

    sources.forEach((source) => {
      expect(filter.files.map((f) => f.id)).toContain(source.fileId);
    });
  });

  it("should get random sources from both files with and without chapters", async () => {
    const filter: PracticeFilter = {
      bucketId: testData.bucketId,
      courses: [],
      files: [
        { id: testData.fileIds[0], chapters: [] },
        {
          id: testData.fileIds[1],
          chapters: [3],
        },
      ],
      studyMode: "concepts",
    };

    const sources = await retrieveRandomSources({ filter });

    expect(sources).toBeDefined();
    expect(Array.isArray(sources)).toBe(true);
    expect(sources.length).toBeGreaterThan(0);
  });

  it("should return empty array when no files are provided", async () => {
    const filter: PracticeFilter = {
      bucketId: testData.bucketId,
      courses: [],
      files: [],
      studyMode: "facts",
    };

    const sources = await retrieveRandomSources({ filter });

    expect(sources).toBeDefined();
    expect(Array.isArray(sources)).toBe(true);
    expect(sources.length).toBe(0);
  });
});
