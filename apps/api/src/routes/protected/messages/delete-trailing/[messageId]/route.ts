import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageWithChatOwnership,
} from "@/src/lib/db/queries/messages.js";
import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import * as z from "zod";

const paramSchema = z.object({ messageId: uuidSchema }).strict();

const app = new Hono().delete(
  "/",
  validator("param", (value) => {
    return paramSchema.parse(value);
  }),
  async (c) => {
    const { messageId } = c.req.valid("param");
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
);

export default app;
