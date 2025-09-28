import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createServiceClient,
  createSupabaseClient,
  createUnauthenticatedClient,
  signInUser,
} from "../setup.js";
import { TEST_USERS, generateTestData } from "../test-utils.js";

describe("get_user_chats function", () => {
  let user1Client: ReturnType<typeof createSupabaseClient>;
  let user2Client: ReturnType<typeof createSupabaseClient>;
  let anonymousClient: ReturnType<typeof createUnauthenticatedClient>;
  let serviceClient: ReturnType<typeof createServiceClient>;

  let testChatId: string;

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
    const { data: chatData, error } = await serviceClient
      .from("chats")
      .insert({
        title: testData.title,
        user_id: TEST_USERS.user1.id,
      })
      .select()
      .single();

    if (error) throw error;

    testChatId = chatData.id;
  });

  afterAll(async () => {
    // Clean up the test data
    if (testChatId) {
      await serviceClient.from("chats").delete().eq("id", testChatId);
    }
  });

  it("should allow a user to retrieve their own chats", async () => {
    const { data, error } = await user1Client.rpc("get_user_chats");

    if (error) throw error;

    expect(data.length).toBeGreaterThan(0);

    // Verify our test chat is in the results
    const testChat = data.find((chat) => chat.id === testChatId);
    expect(testChat).toBeDefined();
    expect(testChat!.title).toBeDefined();
  });

  it("should respect pagination parameters", async () => {
    // Test with a specific page size
    const { data: singlePageData, error: singlePageError } =
      await user1Client.rpc("get_user_chats", {
        page_number: 0,
        items_per_page: 1,
      });

    if (singlePageError) throw singlePageError;

    expect(singlePageData.length).toBeLessThanOrEqual(1);

    // Test second page
    const { data: secondPageData, error: secondPageError } =
      await user1Client.rpc("get_user_chats", {
        page_number: 1,
        items_per_page: 1,
      });

    if (secondPageError) throw secondPageError;

    // If there's enough data, the first and second page should be different
    if (singlePageData.length > 0 && secondPageData.length > 0) {
      expect(singlePageData[0].id).not.toBe(secondPageData[0].id);
    }
  });

  it("should not allow a user to access another user's chats", async () => {
    // user2 should not see user1's chats
    const { data, error } = await user2Client.rpc("get_user_chats");

    if (error) throw error;

    // Ensure user1's test chat is not in the results
    const testChat = data.find((chat) => chat.id === testChatId);
    expect(testChat).toBeUndefined();
  });

  it("should not allow unauthenticated access", async () => {
    const { data, error } = await anonymousClient.rpc("get_user_chats");

    if (error) throw error;

    expect(data.length).toBe(0);
  });
});
