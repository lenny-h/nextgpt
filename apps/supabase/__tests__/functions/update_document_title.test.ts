import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("update_document_title function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let testDocumentId: string;
  let user2DocumentId: string;
  let originalTitle: string;

  beforeAll(async () => {
    user1Client = await signInUser(
      TEST_USERS.user1.email,
      TEST_USERS.user1.password
    );
    anonymousClient = createUnauthenticatedClient();
    serviceClient = createServiceClient();

    // Create a test document for user1
    const testData = generateTestData();
    originalTitle = `Test Document: ${testData.title}`;

    const { data: documentData, error: documentError } = await serviceClient
      .from("documents")
      .insert({
        title: originalTitle,
        user_id: TEST_USERS.user1.id,
        content: `This is test document content: ${testData.timestamp}`,
        kind: "text",
      })
      .select()
      .single();

    if (documentError) throw documentError;

    testDocumentId = documentData.id;

    // Create a test document for user2
    const user2TestData = generateTestData();
    const { data: user2DocumentData, error: user2DocumentError } =
      await serviceClient
        .from("documents")
        .insert({
          title: `User2 Test Document: ${user2TestData.title}`,
          user_id: TEST_USERS.user2.id,
          content: `This is a test document content for user2: ${user2TestData.timestamp}`,
          kind: "text",
        })
        .select()
        .single();

    if (user2DocumentError) throw user2DocumentError;

    user2DocumentId = user2DocumentData.id;
  });

  afterAll(async () => {
    if (testDocumentId) {
      await serviceClient.from("documents").delete().eq("id", testDocumentId);
    }
    if (user2DocumentId) {
      await serviceClient.from("documents").delete().eq("id", user2DocumentId);
    }
  });

  it("should allow a user to update their own document title", async () => {
    const newTitle = `Updated Document Title: ${new Date().toISOString()}`;

    // User1 updates their document title
    const { error: updateError } = await user1Client.rpc(
      "update_document_title",
      {
        p_id: testDocumentId,
        p_title: newTitle,
      }
    );

    if (updateError) throw updateError;

    // Verify the document title has been updated
    const { data: documentData, error: fetchError } = await serviceClient
      .from("documents")
      .select("title")
      .eq("id", testDocumentId)
      .single();

    if (fetchError) throw fetchError;
    expect(documentData.title).toBe(newTitle);
  });

  it("should not allow a user to update another user's document title", async () => {
    // User1 tries to update User2's document title
    const newTitle = `This should not update: ${new Date().toISOString()}`;

    const { error: updateError } = await user1Client.rpc(
      "update_document_title",
      {
        p_id: user2DocumentId,
        p_title: newTitle,
      }
    );

    if (updateError) throw updateError;

    // Verify the document title has not been updated
    const { data: documentData, error: fetchError } = await serviceClient
      .from("documents")
      .select("title")
      .eq("id", user2DocumentId)
      .single();

    if (fetchError) throw fetchError;
    expect(documentData.title).not.toBe(newTitle);
  });

  it("should not allow an unauthenticated user to update a document title", async () => {
    // Anonymous user tries to update a document title
    const newTitle = `This anonymous update should fail: ${new Date().toISOString()}`;

    const { error: updateError } = await anonymousClient.rpc(
      "update_document_title",
      {
        p_id: testDocumentId,
        p_title: newTitle,
      }
    );

    if (updateError) throw updateError;

    // Verify the document title has not been updated
    const { data: documentData, error: fetchError } = await serviceClient
      .from("documents")
      .select("title")
      .eq("id", testDocumentId)
      .single();

    if (fetchError) throw fetchError;
    expect(documentData.title).not.toBe(newTitle);
  });
});
