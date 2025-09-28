import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { saveChat } from "../../../src/lib/db/queries/chats.js";
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  getMessagesByChatId,
  saveMessages,
} from "../../../src/lib/db/queries/messages.js";
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

describe("messages.ts query tests", async () => {
  const testChats: { id: string }[] = [];
  const testMessages: { id: string }[] = [];
  let testUserId: string;
  let testChatId: string;

  const supabase = createServiceClient();

  beforeAll(async () => {
    testUserId = TEST_USERS.user1.id;

    // Create a test chat to use for message tests
    const testData = generateTestData();
    testChatId = testData.uuid;

    await saveChat({
      id: testChatId,
      userId: testUserId,
      title: testData.title,
    });

    testChats.push({ id: testChatId });
  });

  afterAll(async () => {
    // Clean up test data
    for (const message of testMessages) {
      await cleanupTestData(supabase, "messages", "id", message.id);
    }

    for (const chat of testChats) {
      await cleanupTestData(supabase, "chats", "id", chat.id);
    }
  });

  it("should save new messages", async () => {
    // Arrange
    const testData = generateTestData();
    const messageId = testData.uuid;

    const newMessages = [
      {
        id: messageId,
        role: "user" as const,
        parts: [{ type: "text" as const, text: "This is a test message" }],
        created_at: new Date().toISOString(),
      },
    ];

    // Act
    await saveMessages({ chatId: testChatId, newMessages });

    // Save for cleanup
    testMessages.push({ id: messageId });

    // Assert - verify the message exists
    const result = await getMessageById({ userId: testUserId, messageId });

    expect(result.length).toBe(1);
    expect(result[0].id).toBe(messageId);
    expect(result[0].chat_id).toBe(testChatId);
    expect(result[0].role).toBe("user");
    expect(result[0].parts).toEqual([
      { type: "text", text: "This is a test message" },
    ]);
  });

  it("should get messages by chat id", async () => {
    // Arrange
    const messageCount = 3;
    const newMessageIds = [];

    // Create multiple test messages
    for (let i = 0; i < messageCount; i++) {
      const testData = generateTestData();
      const messageId = testData.uuid;

      const newMessages = [
        {
          id: messageId,
          role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
          parts: [{ type: "text" as const, text: `Test message ${i}` }],
          created_at: new Date().toISOString(),
        },
      ];

      await saveMessages({
        chatId: testChatId,
        newMessages,
      });

      newMessageIds.push(messageId);
      testMessages.push({ id: messageId });
    }

    // Act
    const results = await getMessagesByChatId({ chatId: testChatId });

    // Assert
    expect(results.length).toBeGreaterThanOrEqual(messageCount);

    // Check if all our new messages are included
    const resultIds = results.map((message) => message.id);
    for (const id of newMessageIds) {
      expect(resultIds).toContain(id);
    }

    // Check that messages are returned in ascending order by created_at
    for (let i = 1; i < results.length; i++) {
      const prevDate = new Date(results[i - 1].created_at);
      const currDate = new Date(results[i].created_at);
      expect(prevDate.getTime()).toBeLessThanOrEqual(currDate.getTime());
    }
  });

  it("should delete messages by chat id after timestamp", async () => {
    // Arrange
    const testData1 = generateTestData();
    const messageId1 = testData1.uuid;
    const earlierDate = new Date();
    earlierDate.setMinutes(earlierDate.getMinutes() - 10); // 10 minutes ago

    // Create an earlier message
    await supabase.from("messages").insert({
      id: messageId1,
      chat_id: testChatId,
      role: "user",
      parts: { type: "text", text: "Earlier message" },
      created_at: earlierDate.toISOString(),
    });

    testMessages.push({ id: messageId1 });

    const testData2 = generateTestData();
    const messageId2 = testData2.uuid;
    const laterDate = new Date();

    // Create a later message
    await supabase.from("messages").insert({
      id: messageId2,
      chat_id: testChatId,
      role: "assistant",
      parts: { type: "text", text: "Later message" },
      created_at: laterDate.toISOString(),
    });

    testMessages.push({ id: messageId2 });

    // Define cutoff time between the two messages
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - 5); // 5 minutes ago

    // Act
    await deleteMessagesByChatIdAfterTimestamp({
      chatId: testChatId,
      timestamp: cutoffTime.toISOString(),
    });

    // Assert
    const remainingMessages = await getMessagesByChatId({ chatId: testChatId });

    // The later message should be deleted, but the earlier one should still exist
    const remainingIds = remainingMessages.map((msg) => msg.id);
    expect(remainingIds).toContain(messageId1);
    expect(remainingIds).not.toContain(messageId2);
  });
});
