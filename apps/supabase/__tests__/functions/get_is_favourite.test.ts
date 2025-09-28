import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("get_is_favourite function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let user2Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let favouriteChatId: string;
  let nonFavouriteChatId: string;
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

    // Create a favourite chat for user1
    const favouriteTestData = generateTestData();
    const { data: favouriteChatData, error: favouriteError } =
      await serviceClient
        .from("chats")
        .insert({
          title: favouriteTestData.title,
          user_id: TEST_USERS.user1.id,
          is_favourite: true,
        })
        .select()
        .single();

    if (favouriteError) throw favouriteError;

    favouriteChatId = favouriteChatData.id;

    // Create a non-favourite chat for user1
    const nonFavouriteTestData = generateTestData();
    const { data: nonFavouriteChatData, error: nonFavouriteError } =
      await serviceClient
        .from("chats")
        .insert({
          title: nonFavouriteTestData.title,
          user_id: TEST_USERS.user1.id,
          is_favourite: false,
        })
        .select()
        .single();

    if (nonFavouriteError) throw nonFavouriteError;

    nonFavouriteChatId = nonFavouriteChatData.id;

    // Create a chat for user2
    const user2TestData = generateTestData();
    const { data: user2ChatData, error: user2ChatError } = await serviceClient
      .from("chats")
      .insert({
        title: user2TestData.title,
        user_id: TEST_USERS.user2.id,
        is_favourite: true,
      })
      .select()
      .single();

    if (user2ChatError) throw user2ChatError;

    user2ChatId = user2ChatData.id;
  });

  afterAll(async () => {
    // Clean up the test chats
    if (favouriteChatId) {
      await serviceClient.from("chats").delete().eq("id", favouriteChatId);
    }
    if (nonFavouriteChatId) {
      await serviceClient.from("chats").delete().eq("id", nonFavouriteChatId);
    }
    if (user2ChatId) {
      await serviceClient.from("chats").delete().eq("id", user2ChatId);
    }
  });

  it("should return true for a favourite chat", async () => {
    const { data, error } = await user1Client.rpc("get_is_favourite", {
      p_chat_id: favouriteChatId,
    });

    if (error) throw error;

    expect(data.length).toBe(1);
    expect(data[0].is_favourite).toBe(true);
  });

  it("should return false for a non-favourite chat", async () => {
    const { data, error } = await user1Client.rpc("get_is_favourite", {
      p_chat_id: nonFavouriteChatId,
    });

    if (error) throw error;

    expect(data.length).toBe(1);
    expect(data[0].is_favourite).toBe(false);
  });

  it("should not allow a user to check favourite status of another user's chat", async () => {
    const { data, error } = await user1Client.rpc("get_is_favourite", {
      p_chat_id: user2ChatId,
    });

    if (error) throw error;

    expect(data.length).toBe(0);
  });

  it("should not allow an unauthenticated user to check favourite status", async () => {
    const { data, error } = await anonymousClient.rpc("get_is_favourite", {
      p_chat_id: favouriteChatId,
    });

    if (error) throw error;

    expect(data.length).toBe(0);
  });
});
