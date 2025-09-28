import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("delete_chat function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let user2Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let testChatId: string;
  let user2ChatId: string;

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

    // Create a test chat for user1
    const testData = generateTestData();
    const { data: chatData, error: chatError } = await serviceClient
      .from("chats")
      .insert({
        title: testData.title,
        user_id: TEST_USERS.user1.id,
      })
      .select()
      .single();

    if (chatError) throw chatError;

    testChatId = chatData.id;

    // Create a test chat for user2
    const user2TestData = generateTestData();
    const { data: user2ChatData, error: user2ChatError } = await serviceClient
      .from("chats")
      .insert({
        title: user2TestData.title,
        user_id: TEST_USERS.user2.id,
      })
      .select()
      .single();

    if (user2ChatError) throw user2ChatError;

    user2ChatId = user2ChatData.id;
  });

  afterAll(async () => {
    // Clean up the test chats if they still exist
    if (testChatId) {
      await serviceClient.from("chats").delete().eq("id", testChatId);
    }
    if (user2ChatId) {
      await serviceClient.from("chats").delete().eq("id", user2ChatId);
    }
  });

  it("should allow a user to delete their own chat", async () => {
    // User1 deletes their chat
    const { error: deleteError } = await user1Client.rpc("delete_chat", {
      p_chat_id: testChatId,
    });

    if (deleteError) throw deleteError;

    // Verify the chat has been deleted
    const { data: chatData, error: fetchError } = await serviceClient
      .from("chats")
      .select()
      .eq("id", testChatId);

    if (fetchError) throw fetchError;

    expect(chatData.length).toBe(0);
  });

  it("should not allow a user to delete another user's chat", async () => {
    // User1 tries to delete User2's chat
    const { error: deleteError } = await user1Client.rpc("delete_chat", {
      p_chat_id: user2ChatId,
    });

    if (deleteError) throw deleteError;

    // Verify the chat has not been deleted
    const { data: chatData, error: fetchError } = await serviceClient
      .from("chats")
      .select()
      .eq("id", user2ChatId);

    if (fetchError) throw fetchError;

    expect(chatData.length).toBe(1);
  });

  it("should not allow an unauthenticated user to delete a chat", async () => {
    // Anonymous user tries to delete a chat
    const { error: deleteError } = await anonymousClient.rpc("delete_chat", {
      p_chat_id: user2ChatId,
    });

    if (deleteError) throw deleteError;

    // Verify the chat has not been deleted
    const { data: chatData, error: fetchError } = await serviceClient
      .from("chats")
      .select()
      .eq("id", user2ChatId);

    if (fetchError) throw fetchError;

    expect(chatData.length).toBe(1);
  });
});
