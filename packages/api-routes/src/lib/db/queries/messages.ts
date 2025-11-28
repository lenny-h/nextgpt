import { type MyUIMessage } from "@workspace/api-routes/types/custom-ui-message.js";
import { db } from "@workspace/server/drizzle/db.js";
import { chats, messages } from "@workspace/server/drizzle/schema.js";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

export async function getMessageById({ messageId }: { messageId: string }) {
  const result = await db
    .select({ chatId: messages.chatId, createdAt: messages.createdAt })
    .from(messages)
    .where(eq(messages.id, messageId));

  if (result.length === 0) {
    throw new HTTPException(404, { message: "NOT_FOUND" });
  }
  return result[0];
}

export async function getMessagesByChatId({
  chatId,
  messageCount,
}: {
  chatId: string;
  messageCount: number;
}) {
  return await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(desc(messages.createdAt))
    .limit(messageCount);
}

export async function saveMessages({
  chatId,
  newMessages,
}: {
  chatId: string;
  newMessages: MyUIMessage[];
}) {
  const messagesToInsert = newMessages.map((msg) => ({
    chatId,
    ...msg,
  }));

  return await db
    .insert(messages)
    .values(messagesToInsert)
    .onConflictDoUpdate({
      target: messages.id,
      set: {
        chatId: sql`excluded.chat_id`,
        role: sql`excluded.role`,
        parts: sql`excluded.parts`,
        metadata: sql`excluded.metadata`,
      },
    })
    .returning();
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  await db
    .delete(messages)
    .where(
      and(eq(messages.chatId, chatId), gte(messages.createdAt, timestamp))
    );
}

export async function deleteLastMessagePair({ chatId }: { chatId: string }) {
  // Delete the last two messages in the chat
  const lastTwoMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(desc(messages.createdAt))
    .limit(2);

  const messageIdsToDelete = lastTwoMessages.map((msg) => msg.id);

  await db.delete(messages).where(inArray(messages.id, messageIdsToDelete));
}

export async function getMessageWithChatOwnership({
  messageId,
  userId,
}: {
  messageId: string;
  userId: string;
}) {
  const result = await db
    .select({
      chatId: messages.chatId,
      createdAt: messages.createdAt,
      owner: chats.userId,
    })
    .from(messages)
    .innerJoin(chats, eq(messages.chatId, chats.id))
    .where(eq(messages.id, messageId))
    .limit(1);

  if (result.length === 0) {
    throw new HTTPException(404, { message: "NOT_FOUND" });
  }
  return {
    chatId: result[0].chatId,
    createdAt: result[0].createdAt,
    owner: result[0].owner,
  };
}
