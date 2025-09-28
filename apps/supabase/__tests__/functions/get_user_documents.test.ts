import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("get_user_documents function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let user2Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let testDocumentId: string;

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
        content: "Test content for document",
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

  it("should allow a user to retrieve their own documents", async () => {
    const { data, error } = await user1Client.rpc("get_user_documents");

    if (error) throw error;

    expect(data.length).toBeGreaterThan(0);

    // The most recent document should be our test document
    const testDocument = data.find((doc) => doc.id === testDocumentId);
    expect(testDocument).toBeDefined();
    expect(testDocument!.title).toBeDefined();
    expect(testDocument!.kind).toBe("text");
  });

  it("should respect pagination parameters", async () => {
    // Test with a small page size
    const { data: singlePageData, error: singlePageError } =
      await user1Client.rpc("get_user_documents", {
        page_number: 0,
        items_per_page: 1,
      });

    if (singlePageError) throw singlePageError;

    expect(singlePageData.length).toBeLessThanOrEqual(1);

    // Test second page
    const { data: secondPageData, error: secondPageError } =
      await user1Client.rpc("get_user_documents", {
        page_number: 1,
        items_per_page: 1,
      });

    if (secondPageError) throw secondPageError;

    // If there's enough data, the first and second page should be different
    if (singlePageData!.length > 0 && secondPageData!.length > 0) {
      expect(singlePageData[0].id).not.toBe(secondPageData[0].id);
    }
  });

  it("should not allow a user to access another user's documents", async () => {
    // user2 should not see user1's documents
    const { data, error } = await user2Client.rpc("get_user_documents");

    if (error) throw error;

    // Ensure user1's test document is not in the results
    const testDocument = data.find((doc) => doc.id === testDocumentId);
    expect(testDocument).toBeUndefined();
  });

  it("should not allow unauthenticated access", async () => {
    const { data, error } = await anonymousClient.rpc("get_user_documents");

    if (error) throw error;

    expect(data.length).toBe(0);
  });
});
