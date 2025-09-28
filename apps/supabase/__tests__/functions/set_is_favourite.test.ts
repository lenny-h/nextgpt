import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("set_is_favourite function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let testChatId: string;

  beforeAll(async () => {
    user1Client = await signInUser(
      TEST_USERS.user1.email,
      TEST_USERS.user1.password
    );
    anonymousClient = createUnauthenticatedClient();
    serviceClient = createServiceClient();

    // Create a test chat for user1
    const testData = generateTestData();
    const { data: chatData, error } = await serviceClient
      .from("chats")
      .insert({
        title: testData.title,
        user_id: TEST_USERS.user1.id,
        is_favourite: false,
      })
      .select()
      .single();

    if (error) throw error;

    testChatId = chatData.id;
  });

  afterAll(async () => {
    if (testChatId) {
      await serviceClient.from("chats").delete().eq("id", testChatId);
    }
  });

  it("should allow a user to mark their own chat as favourite", async () => {
    // Mark the chat as favourite
    const { error: setFavouriteError } = await user1Client.rpc(
      "set_is_favourite",
      {
        p_chat_id: testChatId,
        p_is_favourite: true,
      }
    );

    if (setFavouriteError) throw setFavouriteError;

    // Verify the change was made
    const { data: chat, error: getError } = await serviceClient
      .from("chats")
      .select("is_favourite")
      .eq("id", testChatId)
      .single();

    if (getError) throw getError;

    expect(chat.is_favourite).toBe(true);
  });

  it("should allow a user to unmark their chat as favourite", async () => {
    // Unmark the chat as favourite
    const { error: setFavouriteError } = await user1Client.rpc(
      "set_is_favourite",
      {
        p_chat_id: testChatId,
        p_is_favourite: false,
      }
    );

    if (setFavouriteError) throw setFavouriteError;

    // Verify the change was made
    const { data: chat, error: getError } = await serviceClient
      .from("chats")
      .select("is_favourite")
      .eq("id", testChatId)
      .single();

    if (getError) throw getError;

    expect(chat.is_favourite).toBe(false);
  });

  it("should not allow a user to modify another user's chat", async () => {
    // Create a chat for user2
    const user2TestData = generateTestData();
    const { data: user2ChatData, error: user2ChatError } = await serviceClient
      .from("chats")
      .insert({
        title: user2TestData.title,
        user_id: TEST_USERS.user2.id,
        is_favourite: false,
      })
      .select()
      .single();

    if (user2ChatError) throw user2ChatError;

    try {
      // User1 should not be able to modify user2's chat
      const { error: user1Error } = await user1Client.rpc("set_is_favourite", {
        p_chat_id: user2ChatData.id,
        p_is_favourite: true,
      });

      if (user1Error) throw user1Error;

      // Verify user2's chat remains unchanged
      const { data: user2Chat, error: getError } = await serviceClient
        .from("chats")
        .select("is_favourite")
        .eq("id", user2ChatData.id)
        .single();

      if (getError) throw getError;

      expect(user2Chat.is_favourite).toBe(false);
    } finally {
      // Clean up user2's chat
      if (user2ChatData?.id) {
        await serviceClient.from("chats").delete().eq("id", user2ChatData.id);
      }
    }
  });

  it("should not allow unauthenticated access", async () => {
    const { error } = await anonymousClient.rpc("set_is_favourite", {
      p_chat_id: testChatId,
      p_is_favourite: true,
    });

    if (error) throw error;

    // is_favourite should still be false
    const { data: chat, error: getError } = await serviceClient
      .from("chats")
      .select("is_favourite")
      .eq("id", testChatId)
      .single();

    if (getError) throw getError;

    expect(chat.is_favourite).toBe(false);
  });
});
