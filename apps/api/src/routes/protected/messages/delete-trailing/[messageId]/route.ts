import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageWithChatOwnership,
} from "@/src/lib/db/queries/messages.js";
import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";

export async function DELETE(c: Context) {
  const messageId = uuidSchema.parse(c.req.param("messageId"));

  const user = c.get("user");

  const messageInfo = await getMessageWithChatOwnership({
    messageId,
    userId: user.id,
  });

  if (messageInfo.owner !== user.id) {
    throw new HTTPException(403, { message: "FORBIDDEN" });
  }

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: messageInfo.chatId,
    timestamp: messageInfo.createdAt,
  });

  return c.json({ message: "Trailing messages deleted" });
}
