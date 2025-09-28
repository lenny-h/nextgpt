import { afterAll, describe, expect, it, vi } from "vitest";
import {
  getDocument,
  insertDocument,
  saveDocument,
} from "../../../src/lib/db/queries/documents.js";
import { ArtifactKind } from "../../../src/types/artifact-kind.js";
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

describe("documents.ts query tests", async () => {
  const testDocuments: { id: string }[] = [];
  const testUserId = TEST_USERS.user1.id;
  let testUserId1 = TEST_USERS.user1.id;

  let testDocumentId: string;
  let testDocumentTitle: string;

  const supabase = createServiceClient();

  afterAll(async () => {
    // Clean up test data
    for (const doc of testDocuments) {
      await cleanupTestData(supabase, "documents", "id", doc.id);
    }
  });

  it("should insert a document", async () => {
    // Arrange
    const documentData = generateTestData();
    testDocumentTitle = documentData.title;
    const testContent = "Test document content";

    // Act
    await insertDocument({
      userId: testUserId1,
      title: testDocumentTitle,
      content: testContent,
      kind: "text",
    });

    // Assert
    const { data: documents, error } = await supabase
      .from("documents")
      .select()
      .eq("user_id", testUserId1)
      .eq("title", testDocumentTitle);

    if (error) {
      throw error;
    }

    expect(documents.length).toBe(1);
    expect(documents[0].content).toBe(testContent);
    expect(documents[0].kind).toBe("text");

    // Store document id for cleanup
    testDocumentId = documents[0].id;
    testDocuments.push({ id: testDocumentId });
  });

  it("should save a document", async () => {
    // Arrange
    const updatedContent = "Updated document content";

    // Act
    await saveDocument({
      userId: testUserId1,
      id: testDocumentId,
      content: updatedContent,
    });

    // Assert
    const { data: document, error } = await supabase
      .from("documents")
      .select()
      .eq("id", testDocumentId)
      .single();

    if (error) {
      throw error;
    }

    expect(document.content).toBe(updatedContent);
  });

  it("should upsert an existing document by user and title", async () => {
    // Arrange
    const upsertedContent = "Upserted document content";

    // Act - Use insertDocument again with the same userId and title
    await insertDocument({
      userId: testUserId1,
      title: testDocumentTitle,
      content: upsertedContent,
      kind: "text",
    });

    // Assert
    const { data: documents, error } = await supabase
      .from("documents")
      .select()
      .eq("user_id", testUserId1)
      .eq("title", testDocumentTitle);

    if (error) {
      throw error;
    }

    expect(documents.length).toBe(1); // Still just one document with that title
    expect(documents[0].content).toBe(upsertedContent); // Content should be updated
  });

  it("should insert a new document", async () => {
    // Arrange
    const testData = generateTestData();
    const documentTitle = testData.title;
    const documentContent = "This is a test document content";

    // Act
    const result = await insertDocument({
      userId: testUserId,
      title: documentTitle,
      content: documentContent,
      kind: "code" as ArtifactKind,
    });

    // Save for cleanup
    expect(result.length).toBe(1);

    testDocuments.push({ id: result[0].id });

    // Assert
    expect(result[0].user_id).toBe(testUserId);
    expect(result[0].title).toBe(documentTitle);
    expect(result[0].content).toBe(documentContent);
    expect(result[0].kind).toBe("code");
  });

  it("should update an existing document when inserting with same title", async () => {
    // Arrange
    const testData = generateTestData();
    const documentTitle = testData.title;

    // Insert initial document
    const initialResult = await insertDocument({
      userId: testUserId,
      title: documentTitle,
      content: "Initial content",
      kind: "code" as ArtifactKind,
    });

    expect(initialResult.length).toBe(1);

    testDocuments.push({ id: initialResult[0].id });
    const documentId = initialResult[0].id;

    // Act - Insert with same title but different content
    const updatedResult = await insertDocument({
      userId: testUserId,
      title: documentTitle,
      content: "Updated content",
      kind: "text" as ArtifactKind,
    });

    // Assert
    expect(updatedResult.length).toBe(1);
    expect(updatedResult[0].id).toBe(documentId); // Same ID
    expect(updatedResult[0].content).toBe("Updated content"); // Updated content
    expect(updatedResult[0].kind).toBe("text"); // Updated kind
  });

  it("should get a document by id", async () => {
    // Arrange
    const testData = generateTestData();
    const documentTitle = testData.title;
    const documentContent = "Content for retrieval test";

    // Insert a document
    const insertResult = await insertDocument({
      userId: testUserId,
      title: documentTitle,
      content: documentContent,
      kind: "text" as ArtifactKind,
    });

    const documentId = insertResult[0].id;
    testDocuments.push({ id: documentId });

    // Act
    const result = await getDocument({ id: documentId });

    // Assert
    expect(result).toBeDefined();
    expect(result.id).toBe(documentId);
    expect(result.user_id).toBe(testUserId);
    expect(result.title).toBe(documentTitle);
    expect(result.content).toBe(documentContent);
    expect(result.kind).toBe("text");
  });

  it("should save (update) a document with new content", async () => {
    // Arrange
    const testData = generateTestData();
    const documentTitle = testData.title;
    const initialContent = "Initial content for save test";
    const updatedContent = "Updated content after save";

    // Insert a document
    const insertResult = await insertDocument({
      userId: testUserId,
      title: documentTitle,
      content: initialContent,
      kind: "code" as ArtifactKind,
    });

    const documentId = insertResult[0].id;
    testDocuments.push({ id: documentId });

    // Act - Save the document with updated content
    const saveResult = await saveDocument({
      userId: testUserId,
      id: documentId,
      content: updatedContent,
    });

    // Assert
    expect(saveResult.length).toBe(1);
    expect(saveResult.length).toBe(1);
    expect(saveResult[0].id).toBe(documentId);
    expect(saveResult[0].content).toBe(updatedContent);

    // Verify by getting the document
    const getResult = await getDocument({ id: documentId });
    expect(getResult.content).toBe(updatedContent);
  });

  it("should throw error when getting a non-existent document", async () => {
    // Arrange
    const nonExistentId = "00000000-0000-0000-0000-000000000000";

    // Act & Assert
    await expect(async () => {
      await getDocument({ id: nonExistentId });
    }).rejects.toThrow("Not found");
  });
});
