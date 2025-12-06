import * as z from "zod";

import {
  getChatById,
  isChatOwner,
} from "@workspace/api-routes/lib/db/queries/chats.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { chats, messages } from "@workspace/server/drizzle/schema.js";
import { and, desc, eq, lte } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const MAX_FORKED_MESSAGES = 14;

const paramSchema = z.object({ chatId: uuidSchema }).strict();

const bodySchema = z
  .object({
    messageId: uuidSchema.optional(), // Optional: fork up to this message
  })
  .strict();

const app = new Hono().post(
  "/",
  validator("param", (value, c) => {
    const parsed = paramSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }
    return parsed.data;
  }),
  validator("json", (value, c) => {
    const parsed = bodySchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }
    return parsed.data;
  }),
  async (c) => {
    const { chatId } = c.req.valid("param");
    const { messageId } = c.req.valid("json");
    const user = c.get("user");

    // Check if user owns the chat
    const hasPermissions = await isChatOwner({ chatId, userId: user.id });
    if (!hasPermissions) {
      throw new HTTPException(404, { message: "NOT_FOUND" });
    }

    // Get original chat
    const originalChat = await getChatById({ id: chatId });

    // Get messages to copy (fetch only what we need using LIMIT)
    let messagesToCopy;
    if (messageId) {
      // Get the timestamp of the specified message
      const targetMessage = await db
        .select({ createdAt: messages.createdAt })
        .from(messages)
        .where(eq(messages.id, messageId))
        .limit(1);

      if (targetMessage.length === 0) {
        throw new HTTPException(404, { message: "MESSAGE_NOT_FOUND" });
      }

      // Get the last MAX_FORKED_MESSAGES messages up to and including the target message
      // Order by DESC to get the most recent ones, then reverse for chronological order
      const recentMessages = await db
        .select({
          role: messages.role,
          parts: messages.parts,
          metadata: messages.metadata,
        })
        .from(messages)
        .where(
          and(
            eq(messages.chatId, chatId),
            lte(messages.createdAt, targetMessage[0].createdAt)
          )
        )
        .orderBy(desc(messages.createdAt))
        .limit(MAX_FORKED_MESSAGES);

      // Reverse to get chronological order
      messagesToCopy = recentMessages.reverse();
    } else {
      // Get the last MAX_FORKED_MESSAGES messages
      // Order by DESC to get the most recent ones, then reverse for chronological order
      const recentMessages = await db
        .select({
          role: messages.role,
          parts: messages.parts,
          metadata: messages.metadata,
        })
        .from(messages)
        .where(eq(messages.chatId, chatId))
        .orderBy(desc(messages.createdAt))
        .limit(MAX_FORKED_MESSAGES);

      // Reverse to get chronological order
      messagesToCopy = recentMessages.reverse();
    }

    // Create new chat with "(Fork)" suffix
    const newChatResult = await db
      .insert(chats)
      .values({
        userId: user.id,
        title: `${originalChat.title} (Fork)`,
        isFavourite: false,
      })
      .returning();

    const newChat = newChatResult[0];

    // Copy messages to new chat
    if (messagesToCopy.length > 0) {
      await db.insert(messages).values(
        messagesToCopy.map((msg) => ({
          chatId: newChat.id,
          role: msg.role,
          parts: msg.parts,
          metadata: msg.metadata,
        }))
      );
    }

    return c.json({
      id: newChat.id,
      title: newChat.title,
    });
  }
);

export default app;
