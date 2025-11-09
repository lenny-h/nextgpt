import * as z from "zod";

import {
  deleteMessagesByChatIdAfterTimestamp,
  getMessageWithChatOwnership,
} from "@workspace/api-routes/lib/db/queries/messages.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const paramSchema = z.object({ messageId: uuidSchema }).strict();

const app = new Hono().delete(
  "/",
  validator("param", (value, c) => {
    const parsed = paramSchema.safeParse(value);
    if (!parsed.success) {
      return c.text("BAD_REQUEST", 400);
    }
    return parsed.data;
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
