import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS } from "../test-utils.js";

describe("ilike_user_chats function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let user2Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let testChatIds: string[] = [];

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

    // Create multiple test chats for user1 with distinct title patterns
    const testTitles = [
      "Apple Search Test",
      "Banana Search Test",
      "Apple Banana Test",
      "Something Else",
    ];

    for (const title of testTitles) {
      const { data, error } = await serviceClient
        .from("chats")
        .insert({
          title,
          user_id: TEST_USERS.user1.id,
        })
        .select()
        .single();

      if (error) throw error;

      testChatIds.push(data.id);
    }

    // Create a test chat for user2 with similar title
    const { data, error } = await serviceClient
      .from("chats")
      .insert({
        title: "Apple User2 Test",
        user_id: TEST_USERS.user2.id,
      })
      .select()
      .single();

    if (error) throw error;

    testChatIds.push(data.id);
  });

  afterAll(async () => {
    // Clean up all test chats
    for (const id of testChatIds) {
      await serviceClient.from("chats").delete().eq("id", id);
    }
  });

  it("should find chats with titles containing the search prefix", async () => {
    const { data, error } = await user1Client.rpc("ilike_user_chats", {
      prefix: "Apple",
    });

    if (error) throw error;

    // Should find both "Apple Search Test" and "Apple Banana Test"
    expect(data.length).toBeGreaterThanOrEqual(2);

    // Verify all returned chats contain "Apple" in their title
    for (const chat of data) {
      expect(chat.title.includes("Apple")).toBe(true);
      expect(chat.user_id).toBe(TEST_USERS.user1.id);
    }
  });

  it("should only return the user's own chats", async () => {
    // User1 searches for "Apple"
    const { data: user1Data, error: user1Error } = await user1Client.rpc(
      "ilike_user_chats",
      {
        prefix: "Apple",
      }
    );

    if (user1Error) throw user1Error;

    // All returned chats should belong to user1
    for (const chat of user1Data) {
      expect(chat.user_id).toBe(TEST_USERS.user1.id);
    }

    // User2 searches for "Apple"
    const { data: user2Data, error: user2Error } = await user2Client.rpc(
      "ilike_user_chats",
      {
        prefix: "Apple",
      }
    );

    if (user2Error) throw user2Error;

    // All returned chats should belong to user2
    for (const chat of user2Data) {
      expect(chat.user_id).toBe(TEST_USERS.user2.id);
    }
  });

  it("should return an empty array for non-matching search", async () => {
    const { data, error } = await user1Client.rpc("ilike_user_chats", {
      prefix: "NonExistentSearchTerm",
    });

    if (error) throw error;

    expect(data.length).toBe(0);
  });

  it("should not allow unauthenticated access", async () => {
    const { data, error } = await anonymousClient.rpc("ilike_user_chats", {
      prefix: "Apple",
    });

    if (error) throw error;

    expect(data.length).toBe(0);
  });
});
