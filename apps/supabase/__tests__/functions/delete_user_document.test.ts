import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("delete_document function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let testDocumentId: string;

  beforeEach(async () => {
    user1Client = await signInUser(
      TEST_USERS.user1.email,
      TEST_USERS.user1.password
    );
    anonymousClient = createUnauthenticatedClient();
    serviceClient = createServiceClient();

    // Create a fresh test document for each test
    const testData = generateTestData();
    const { data: documentData, error } = await serviceClient
      .from("documents")
      .insert({
        title: testData.title,
        user_id: TEST_USERS.user1.id,
        content: "Test content for document deletion",
        kind: "text",
      })
      .select()
      .single();

    if (error) throw error;

    testDocumentId = documentData.id;
  });

  afterEach(async () => {
    // Try to clean up any test document that wasn't deleted by the test
    if (testDocumentId) {
      await serviceClient.from("documents").delete().eq("id", testDocumentId);
    }
  });

  it("should allow a user to delete their own document", async () => {
    // Delete the document
    const { error: deleteError } = await user1Client.rpc("delete_document", {
      p_id: testDocumentId,
    });

    if (deleteError) throw deleteError;

    // Verify the document was deleted
    const { data: document, error: getError } = await serviceClient
      .from("documents")
      .select()
      .eq("id", testDocumentId)
      .single();

    expect(getError).not.toBeNull();
    expect(document).toBeNull();

    // Clear testDocumentId since we've deleted it
    testDocumentId = "";
  });

  it("should not allow a user to delete another user's document", async () => {
    // Create a document for user2
    const user2TestData = generateTestData();
    const { data: user2DocumentData, error: user2DocumentError } =
      await serviceClient
        .from("documents")
        .insert({
          title: user2TestData.title,
          user_id: TEST_USERS.user2.id,
          content: "This is user2's document content for testing deletion.",
          kind: "text",
        })
        .select()
        .single();

    if (user2DocumentError) throw user2DocumentError;

    try {
      // User1 should not be able to delete user2's document
      const { error: user1DeleteError } = await user1Client.rpc(
        "delete_document",
        {
          p_id: user2DocumentData.id,
        }
      );

      if (user1DeleteError) throw user1DeleteError;

      // Verify that user2's document still exists
      const { data: user2Document, error: getError } = await serviceClient
        .from("documents")
        .select()
        .eq("id", user2DocumentData.id)
        .single();

      if (getError) throw getError;

      expect(user2Document).not.toBeNull(); // Document should still exist
    } finally {
      // Clean up user2's document
      if (user2DocumentData?.id) {
        await serviceClient
          .from("documents")
          .delete()
          .eq("id", user2DocumentData.id);
      }
    }
  });

  it("should not allow unauthenticated access", async () => {
    const { error } = await anonymousClient.rpc("delete_document", {
      p_id: testDocumentId,
    });

    if (error) throw error;

    // Expecting document to still exist
    const { data: document, error: getError } = await serviceClient
      .from("documents")
      .select()
      .eq("id", testDocumentId)
      .single();

    if (getError) throw getError;

    expect(document).not.toBeNull(); // Document should still exist
  });
});
