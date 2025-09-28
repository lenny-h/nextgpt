import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import {
  deleteLastMessage,
  isChatOwner,
} from "../../../../../lib/db/queries/messages.js";
import { uuidSchema } from "../../../../../schemas/uuid-schema.js";

export async function DELETE(c: Context) {
  const chatId = uuidSchema.parse(c.req.param("chatId"));

  const user = c.get("user");

  const hasPermission = await isChatOwner({
    userId: user.id,
    chatId,
  });

  if (!hasPermission) {
    throw new HTTPException(403, { message: "Forbidden" });
  }

  await deleteLastMessage({
    chatId,
  });

  return c.text("Last message deleted");
}
