import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("get_favourite_user_chats function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let user2Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let testFavouriteChatId: string;
  let testNonFavouriteChatId: string;

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

    // Create a favourite test chat for user1
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

    testFavouriteChatId = favouriteChatData.id;

    // Create a non-favourite test chat for user1
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

    testNonFavouriteChatId = nonFavouriteChatData.id;
  });

  afterAll(async () => {
    // Clean up the test data
    if (testFavouriteChatId) {
      await serviceClient.from("chats").delete().eq("id", testFavouriteChatId);
    }
    if (testNonFavouriteChatId) {
      await serviceClient
        .from("chats")
        .delete()
        .eq("id", testNonFavouriteChatId);
    }
  });

  it("should allow a user to retrieve only their favourite chats", async () => {
    const { data, error } = await user1Client.rpc("get_favourite_user_chats");

    if (error) throw error;

    // Verify our favourite chat is in the results
    const favouriteChat = data.find((chat) => chat.id === testFavouriteChatId);
    expect(favouriteChat).toBeDefined();
    expect(favouriteChat!.is_favourite).toBe(true);

    // Verify our non-favourite chat is NOT in the results
    const nonFavouriteChat = data.find(
      (chat) => chat.id === testNonFavouriteChatId
    );
    expect(nonFavouriteChat).toBeUndefined();
  });

  it("should respect pagination parameters", async () => {
    // Insert a second favourite chat to test pagination
    const secondFavouriteData = generateTestData();
    const { data: secondFavourite, error: secondFavouriteError } =
      await serviceClient
        .from("chats")
        .insert({
          title: secondFavouriteData.title,
          user_id: TEST_USERS.user1.id,
          is_favourite: true,
        })
        .select()
        .single();

    if (secondFavouriteError) throw secondFavouriteError;

    try {
      // Test with a specific page size
      const { data: singlePageData, error: singlePageError } =
        await user1Client.rpc("get_favourite_user_chats", {
          page_number: 0,
          items_per_page: 1,
        });

      if (singlePageError) throw singlePageError;

      expect(singlePageData.length).toBeLessThanOrEqual(1);

      // Test that all returned chats are marked as favourite
      for (const chat of singlePageData!) {
        expect(chat.is_favourite).toBe(true);
      }
    } finally {
      // Clean up the second favourite chat
      if (secondFavourite?.id) {
        await serviceClient.from("chats").delete().eq("id", secondFavourite.id);
      }
    }
  });

  it("should not allow a user to access another user's favourite chats", async () => {
    // Create a favourite chat for user2
    const user2FavouriteData = generateTestData();
    const { data: user2FavouriteChatData, error: user2FavouriteError } =
      await serviceClient
        .from("chats")
        .insert({
          title: `User2 Favourite: ${user2FavouriteData.title}`,
          user_id: TEST_USERS.user2.id,
          is_favourite: true,
        })
        .select()
        .single();

    if (user2FavouriteError) throw user2FavouriteError;

    try {
      // User1 should not see User2's favourite chats
      const { data: user1Data, error: user1Error } = await user1Client.rpc(
        "get_favourite_user_chats"
      );

      if (user1Error) throw user1Error;

      // User2's favourite chat should not be in User1's results
      const user2FavouriteInUser1Results = user1Data.find(
        (chat) => chat.id === user2FavouriteChatData.id
      );
      expect(user2FavouriteInUser1Results).toBeUndefined();

      // User1's favourite chat should not be in User2's results
      const { data: user2Data, error: user2Error } = await user2Client.rpc(
        "get_favourite_user_chats"
      );

      if (user2Error) throw user2Error;

      const user1FavouriteInUser2Results = user2Data.find(
        (chat) => chat.id === testFavouriteChatId
      );
      expect(user1FavouriteInUser2Results).toBeUndefined();
    } finally {
      // Clean up user2's favourite chat
      if (user2FavouriteChatData?.id) {
        await serviceClient
          .from("chats")
          .delete()
          .eq("id", user2FavouriteChatData.id);
      }
    }
  });

  it("should not allow unauthenticated access", async () => {
    const { data, error } = await anonymousClient.rpc(
      "get_favourite_user_chats"
    );

    if (error) throw error;

    expect(data.length).toBe(0);
  });
});
