import {
  deleteLastMessage,
  isChatOwner,
} from "@/src/lib/db/queries/messages.js";
import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";

export async function DELETE(c: Context) {
  const chatId = uuidSchema.parse(c.req.param("chatId"));

  const user = c.get("user");

  const hasPermission = await isChatOwner({
    userId: user.id,
    chatId,
  });

  if (!hasPermission) {
    throw new HTTPException(403, { message: "FORBIDDEN" });
  }

  await deleteLastMessage({
    chatId,
  });

  return c.json("Last message deleted");
}
