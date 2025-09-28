import { type Context } from "hono";
import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
} from "../../../../../lib/db/queries/messages.js";
import { uuidSchema } from "../../../../../schemas/uuid-schema.js";
import { HTTPException } from "hono/http-exception";

export async function DELETE(c: Context) {
  const messageId = uuidSchema.parse(c.req.param("messageId"));

  const user = c.get("user");

  const [message] = await getMessageById({ userId: user.id, messageId });

  if (!message) {
    throw new HTTPException(404, { message: "Message not found" });
  }

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chat_id,
    timestamp: message.created_at,
  });

  return c.text("Trailing messages deleted");
}
