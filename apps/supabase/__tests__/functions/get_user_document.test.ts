import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("get_user_document function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let user2Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let testDocumentId: string;
  const testContent =
    "This is test document content for testing get_user_document function.";

  beforeAll(async () => {
    user1Client = await signInUser(
      TEST_USERS.user1.email,
      TEST_USERS.user1.password
    );
    user2Client = await signInUser(
      TEST_USERS.user2.email,
      TEST_USERS.user2.password
    );
    anonymousClient = createUnauthenticatedClient();
    serviceClient = createServiceClient();

    // Create a test document for user1
    const testData = generateTestData();
    const { data: documentData, error } = await serviceClient
      .from("documents")
      .insert({
        title: testData.title,
        user_id: TEST_USERS.user1.id,
        content: testContent,
        kind: "text",
      })
      .select()
      .single();

    if (error) throw error;

    testDocumentId = documentData.id;
  });

  afterAll(async () => {
    // Clean up the test data
    if (testDocumentId) {
      await serviceClient.from("documents").delete().eq("id", testDocumentId);
    }
  });

  it("should allow a user to retrieve their own document", async () => {
    const { data, error } = await user1Client.rpc("get_user_document", {
      p_id: testDocumentId,
    });

    if (error) throw error;

    expect(data.length).toBe(1);
    expect(data[0].content).toBe(testContent);
  });

  it("should not allow a user to access another user's document", async () => {
    // Create a document for user2
    const user2TestData = generateTestData();
    const user2Content = "This is user2's document content for testing.";
    const { data: user2DocumentData, error: user2DocumentError } =
      await serviceClient
        .from("documents")
        .insert({
          title: user2TestData.title,
          user_id: TEST_USERS.user2.id,
          content: user2Content,
          kind: "text",
        })
        .select()
        .single();

    if (user2DocumentError) throw user2DocumentError;

    try {
      // User1 should not be able to access user2's document
      const { data: user1TryingToAccessUser2Document, error: user1Error } =
        await user1Client.rpc("get_user_document", {
          p_id: user2DocumentData.id,
        });

      if (user1Error) throw user1Error;

      expect(user1TryingToAccessUser2Document.length).toBe(0); // Should not return any data

      // User2 should not be able to access user1's document
      const { data: user2TryingToAccessUser1Document, error: user2Error } =
        await user2Client.rpc("get_user_document", {
          p_id: testDocumentId,
        });

      if (user2Error) throw user2Error;

      expect(user2TryingToAccessUser1Document.length).toBe(0); // Should not return any data
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
    const { data, error } = await anonymousClient.rpc("get_user_document", {
      p_id: testDocumentId,
    });

    if (error) throw error;

    expect(data.length).toBe(0);
  });
});
