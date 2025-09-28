import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("ilike_user_documents function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let user2Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let testDocumentIds: string[] = [];

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

    // Create multiple test documents for user1 with distinct title patterns
    const testTitles = [
      "Research Document Apple",
      "Meeting Notes Banana",
      "Project Plan Apple Banana",
      "Something Else",
    ];

    for (const title of testTitles) {
      const testData = generateTestData();
      const { data, error } = await serviceClient
        .from("documents")
        .insert({
          title,
          user_id: TEST_USERS.user1.id,
          content: `Content for ${title}: ${testData.timestamp}`,
          kind: "text",
        })
        .select()
        .single();

      if (error) throw error;

      testDocumentIds.push(data.id);
    }

    // Create a test document for user2 with similar title
    const user2TestData = generateTestData();
    const { data, error } = await serviceClient
      .from("documents")
      .insert({
        title: "User2 Research Apple",
        user_id: TEST_USERS.user2.id,
        content: `This is a test document content for user2: ${user2TestData.timestamp}`,
        kind: "text",
      })
      .select()
      .single();

    if (error) throw error;

    testDocumentIds.push(data.id);
  });

  afterAll(async () => {
    // Clean up all test documents
    for (const id of testDocumentIds) {
      await serviceClient.from("documents").delete().eq("id", id);
    }
  });

  it("should find documents with titles containing the search prefix", async () => {
    const { data, error } = await user1Client.rpc("ilike_user_documents", {
      prefix: "Apple",
    });

    if (error) throw error;

    // Should find "Research Document Apple" and "Project Plan Apple Banana"
    expect(data.length).toBeGreaterThanOrEqual(2);

    // Verify returned documents contain "Apple" in their title
    for (const doc of data) {
      expect(doc.title.includes("Apple")).toBe(true);
    }
  });

  it("should only return the user's own documents", async () => {
    // User1 searches for "Apple"
    const { data: user1Data, error: user1Error } = await user1Client.rpc(
      "ilike_user_documents",
      {
        prefix: "Apple",
      }
    );

    if (user1Error) throw user1Error;

    // Verify all returned documents belong to user1
    const { data: allUser1Docs, error: user1DocsError } = await serviceClient
      .from("documents")
      .select("id")
      .eq("user_id", TEST_USERS.user1.id);

    if (user1DocsError) throw user1DocsError;

    const user1DocIds = allUser1Docs.map((doc) => doc.id);

    for (const doc of user1Data) {
      expect(user1DocIds).toContain(doc.id);
    }

    // User2 searches for "Apple"
    const { data: user2Data, error: user2Error } = await user2Client.rpc(
      "ilike_user_documents",
      {
        prefix: "Apple",
      }
    );

    if (user2Error) throw user2Error;

    // Verify all returned documents belong to user2
    const { data: allUser2Docs, error: user2DocsError } = await serviceClient
      .from("documents")
      .select("id")
      .eq("user_id", TEST_USERS.user2.id);

    if (user2DocsError) throw user2DocsError;

    const user2DocIds = allUser2Docs.map((doc) => doc.id);

    for (const doc of user2Data) {
      expect(user2DocIds).toContain(doc.id);
    }
  });

  it("should return an empty array for non-matching search", async () => {
    const { data, error } = await user1Client.rpc("ilike_user_documents", {
      prefix: "NonExistentSearchTerm",
    });

    if (error) throw error;

    expect(data.length).toBe(0);
  });

  it("should not allow unauthenticated access", async () => {
    const { data, error } = await anonymousClient.rpc("ilike_user_documents", {
      prefix: "Apple",
    });

    if (error) throw error;

    expect(data.length).toBe(0);
  });
});
