import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  deletePage,
  getFilePages,
  matchDocuments,
  retrievePagesByChapter,
  retrievePagesByPageNumbers,
} from "../../../src/lib/db/queries/pages.js";
import { createServiceClient } from "../../../src/utils/supabase/service-client.js";
import {
  cleanupTestData,
  generateTestData,
  TEST_USERS,
} from "./config/utils.js";

// Mock server-only module
vi.mock("server-only", () => {
  return {
    // mock server-only module
  };
});

describe("pages.ts query tests", async () => {
  const testFiles: { id: string }[] = [];
  const testPages: { id: string; course_id: string }[] = [];
  const testCourses: { id: string }[] = [];
  const testBuckets: { id: string }[] = [];

  let testUserId = TEST_USERS.user1.id;
  let testBucketId: string;
  let testCourseId: string;
  let testFileId: string;
  let testPageId: string;

  const supabase = createServiceClient();

  beforeAll(async () => {
    // Create a test bucket
    const bucketData = generateTestData();
    testBucketId = bucketData.uuid;

    const { error: bucketError } = await supabase
      .from("buckets")
      .insert({
        id: testBucketId,
        owner: testUserId,
        name: bucketData.title,
        max_size: 1024 * 1024 * 1024, // 1GB
        size: 0,
        type: "small",
      })
      .select()
      .single();

    if (bucketError) throw bucketError;

    testBuckets.push({ id: testBucketId });

    // Create a test course
    const courseData = generateTestData();
    testCourseId = courseData.uuid;

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .insert({
        id: testCourseId,
        bucket_id: testBucketId,
        name: courseData.title,
      })
      .select()
      .single();

    if (courseError) throw courseError;

    testCourses.push({ id: testCourseId });

    // Create a test file
    const fileData = generateTestData();
    testFileId = fileData.uuid;

    const { data: file, error: fileError } = await supabase
      .from("files")
      .insert({
        id: testFileId,
        course_id: testCourseId,
        name: fileData.title + ".pdf",
        size: 1024, // 1KB
      })
      .select()
      .single();

    if (fileError) throw fileError;

    testFiles.push({ id: testFileId });

    // Create a test page for getFilePages and deletePage tests
    const pageData = generateTestData();
    testPageId = pageData.uuid;

    const testEmbedding = Array(768)
      .fill(0)
      .map(() => 2 * Math.random() - 1);

    const { error: pageError } = await supabase
      .from("pages")
      .insert({
        id: testPageId,
        file_id: testFileId,
        file_name: fileData.title + ".pdf",
        course_id: testCourseId,
        course_name: courseData.title,
        content: "Test page content",
        embedding: JSON.stringify(testEmbedding),
        page_index: 0,
      })
      .select()
      .single();

    if (pageError) {
      throw pageError;
    }

    testPages.push({ id: testPageId, course_id: testCourseId });

    // Create some additional test pages for other tests
    const pageCount = 3;
    for (let i = 1; i <= pageCount; i++) {
      const additionalPageData = generateTestData();
      const additionalPageId = additionalPageData.uuid;

      const embedding = Array(768)
        .fill(0)
        .map(() => Math.random() * 2 - 1);

      const { error: additionalPageError } = await supabase
        .from("pages")
        .insert({
          id: additionalPageId,
          file_id: testFileId,
          file_name: file.name,
          course_id: testCourseId,
          course_name: course.name,
          content: `Test page ${i + 1} content.`,
          embedding: JSON.stringify(embedding),
          page_index: i,
          page_number: i + 1,
          chapter: Math.floor(i / 2) + 1, // Chapters: 1, 1, 2 for pages 1, 2, 3
        })
        .select()
        .single();

      if (additionalPageError) throw additionalPageError;

      testPages.push({ id: additionalPageId, course_id: testCourseId });
    }
  });

  afterAll(async () => {
    // Clean up test data
    for (const page of testPages) {
      await supabase
        .from("pages")
        .delete()
        .eq("id", page.id)
        .eq("course_id", page.course_id);
    }

    for (const file of testFiles) {
      await cleanupTestData(supabase, "files", "id", file.id);
    }

    for (const course of testCourses) {
      await cleanupTestData(supabase, "courses", "id", course.id);
    }

    for (const bucket of testBuckets) {
      await cleanupTestData(supabase, "buckets", "id", bucket.id);
    }
  });

  it("should get file pages", async () => {
    // Act
    const pages = await getFilePages({ fileId: testFileId });

    // Assert
    expect(Array.isArray(pages)).toBe(true);
    expect(pages.length).toBeGreaterThanOrEqual(1);
    expect(pages.some((p) => p.id === testPageId)).toBe(true);
  });

  it("should get pages by page numbers", async () => {
    // Arrange
    const pageNumbers = [1, 2, 3]; // These should match the page_number values we created
    const filter = {
      bucketId: testBucketId,
      courses: [testCourseId],
      files: [],
      documents: [],
    };

    // Act - Without content
    const resultWithoutContent = await retrievePagesByPageNumbers({
      pageNumbers,
      filter,
      retrieveContent: false,
    });

    // Assert
    expect(resultWithoutContent.length).toBeGreaterThan(0);

    // Check that content is not included
    resultWithoutContent.forEach((page) => {
      expect(page.pageContent).toBeUndefined();
    });

    // Act - With content
    const resultWithContent = await retrievePagesByPageNumbers({
      pageNumbers,
      filter,
      retrieveContent: true,
    });

    // Assert
    expect(resultWithContent.length).toBeGreaterThan(0);

    // Check that content is included
    resultWithContent.forEach((page) => {
      expect(page.pageContent).toBeDefined();
      expect(typeof page.pageContent).toBe("string");
    });
  });

  it("should match documents using vector search", async () => {
    // Arrange
    const queryEmbedding = Array(768)
      .fill(0)
      .map(() => Math.random() * 2 - 1);

    // Act - Search by course
    const resultByCourse = await matchDocuments({
      queryEmbedding,
      filter: {
        bucketId: testBucketId,
        courses: [testCourseId],
        files: [],
        documents: [],
      },
      retrieveContent: true,
      matchThreshold: 0.0, // Set very low threshold to ensure we get results in test
      matchCount: 10,
    });

    // Assert
    expect(resultByCourse.length).toBeGreaterThan(0);

    // Check content and file relationships
    if (resultByCourse.length > 0) {
      resultByCourse.forEach((page) => {
        expect(page.courseId).toBe(testCourseId);
        expect(page.pageContent).toBeDefined();
      });
    }

    // Act - Search by file
    const resultByFile = await matchDocuments({
      queryEmbedding,
      filter: {
        bucketId: testBucketId,
        courses: [],
        files: [testFileId],
        documents: [],
      },
      retrieveContent: true,
      matchThreshold: 0.0, // Set very low threshold to ensure we get results in test
      matchCount: 10,
    });

    // Assert
    expect(resultByFile.length).toBeGreaterThan(0);

    // Check content and file relationships
    if (resultByFile.length > 0) {
      resultByFile.forEach((page) => {
        expect(page.fileId).toBe(testFileId);
        expect(page.pageContent).toBeDefined();
      });
    }
  });

  it("should get pages by chapter", async () => {
    // Arrange
    const chapterNumber = 1; // Test chapter 1 which should have 2 pages (page_index 1 and 2)
    const filter = {
      bucketId: testBucketId,
      courses: [testCourseId],
      files: [],
      documents: [],
    };

    // Act - Without content
    const resultWithoutContent = await retrievePagesByChapter({
      chapter: chapterNumber,
      filter,
      retrieveContent: false,
    });

    // Assert
    expect(resultWithoutContent.length).toBeGreaterThan(0);
    expect(resultWithoutContent.length).toBeLessThanOrEqual(2); // Chapter 1 should have 2 pages

    // Check that content is not included
    resultWithoutContent.forEach((page) => {
      expect(page.pageContent).toBeUndefined();
    });

    // Check that pages are ordered by page_index
    for (let i = 1; i < resultWithoutContent.length; i++) {
      expect(resultWithoutContent[i].pageIndex).toBeGreaterThanOrEqual(
        resultWithoutContent[i - 1].pageIndex
      );
    }

    // Act - With content
    const resultWithContent = await retrievePagesByChapter({
      chapter: chapterNumber,
      filter,
      retrieveContent: true,
    });

    // Assert
    expect(resultWithContent.length).toBeGreaterThan(0);

    // Check that content is included
    resultWithContent.forEach((page) => {
      expect(page.pageContent).toBeDefined();
      expect(typeof page.pageContent).toBe("string");
    });

    // Test chapter 2 as well
    const resultChapter2 = await retrievePagesByChapter({
      chapter: 2,
      filter,
      retrieveContent: true,
    });

    // Assert - Chapter 2 should have 1 page (page_index 3)
    expect(resultChapter2.length).toBe(1);
    if (resultChapter2.length > 0) {
      expect(resultChapter2[0].pageContent).toBeDefined();
    }
  });

  it("should delete a page", async () => {
    // Act
    await deletePage({ pageId: testPageId });

    // Assert
    const { data: remainingPages, error } = await supabase
      .from("pages")
      .select()
      .eq("id", testPageId);

    if (error) {
      throw error;
    }

    expect(remainingPages.length).toBe(0);

    // Remove from cleanup array
    const index = testPages.findIndex((p) => p.id === testPageId);
    if (index !== -1) {
      testPages.splice(index, 1);
    }
  });
});
