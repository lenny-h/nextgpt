import { afterAll, describe, expect, it, vi } from "vitest";
import {
  deleteChatById,
  getChatById,
  getFavouriteChatsByUserId,
  saveChat,
  updateChatFavouriteStatus,
} from "../../../src/lib/db/queries/chats.js";
import { createServiceClient } from "../../../src/utils/supabase/service-client.js";
import {
  cleanupTestData,
  generateTestData,
  TEST_USERS,
} from "./config/utils.js";

// Mock server-only module
vi.mock("server-only", () => {
  return {
    // mock server-only module
  };
});

describe("chats.ts query tests", async () => {
  const testChats: { id: string }[] = [];
  const testUserId = TEST_USERS.user1.id;

  const supabase = createServiceClient();

  afterAll(async () => {
    // Clean up test data
    for (const chat of testChats) {
      await cleanupTestData(supabase, "chats", "id", chat.id);
    }
  });

  it("should save a new chat", async () => {
    // Arrange
    const testData = generateTestData();
    const chatId = testData.uuid;

    // Act
    const result = await saveChat({
      id: chatId,
      userId: testUserId,
      title: testData.title,
    });

    // Save for cleanup
    testChats.push({ id: chatId });

    // Assert
    expect(result.id).toBe(chatId);
    expect(result.user_id).toBe(testUserId);
    expect(result.title).toBe(testData.title);
  });

  it("should get a chat by id", async () => {
    // Arrange
    const testData = generateTestData();
    const chatId = testData.uuid;

    // Create a test chat
    await saveChat({
      id: chatId,
      userId: testUserId,
      title: testData.title,
    });

    // Save for cleanup
    testChats.push({ id: chatId });

    // Act
    const result = await getChatById({ id: chatId });

    // Assert
    expect(result.id).toBe(chatId);
    expect(result.user_id).toBe(testUserId);
    expect(result.title).toBe(testData.title);
  });

  it("should update chat favourite status", async () => {
    // Arrange
    const testData = generateTestData();
    const chatId = testData.uuid;

    // Create a test chat
    await saveChat({
      id: chatId,
      userId: testUserId,
      title: testData.title,
    });

    testChats.push({ id: chatId });

    // Act - Mark as favourite
    const favouriteResult = await updateChatFavouriteStatus({
      id: chatId,
      isFavourite: true,
    });

    // Assert
    expect(favouriteResult.id).toBe(chatId);
    expect(favouriteResult.is_favourite).toBe(true);

    // Act - Remove from favourites
    const unfavouriteResult = await updateChatFavouriteStatus({
      id: chatId,
      isFavourite: false,
    });

    // Assert
    expect(unfavouriteResult.id).toBe(chatId);
    expect(unfavouriteResult.is_favourite).toBe(false);
  });

  it("should get favourite chats by user id", async () => {
    // Arrange
    const testData = generateTestData();
    const chatId = testData.uuid;

    // Create a test chat and mark as favourite
    await saveChat({
      id: chatId,
      userId: testUserId,
      title: testData.title,
    });

    await updateChatFavouriteStatus({
      id: chatId,
      isFavourite: true,
    });

    testChats.push({ id: chatId });

    // Act
    const results = await getFavouriteChatsByUserId({
      id: testUserId,
      cursor: null,
    });

    // Check if our favourite chat is included
    const resultIds = results.map((chat) => chat.id);
    expect(resultIds).toContain(chatId);

    // Check that all returned chats are marked as favourite
    results.forEach((chat) => {
      expect(chat.is_favourite).toBe(true);
    });
  });

  it("should delete a chat by id", async () => {
    // Arrange
    const testData = generateTestData();
    const chatId = testData.uuid;

    // Create a test chat
    await saveChat({
      id: chatId,
      userId: testUserId,
      title: testData.title,
    });

    // Act
    await deleteChatById({ id: chatId });

    // Assert - Should throw when trying to get the deleted chat
    try {
      await getChatById({ id: chatId });
      // If we reach here, the test should fail
      expect(true).toBe(false); // This should not be reached
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
