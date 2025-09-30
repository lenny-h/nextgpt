import { ChatHandlerFactory } from "@/src/lib/chat/index.js";
import {
  deleteChatById,
  getChatById,
  updateChatFavouriteStatus,
} from "@/src/lib/db/queries/chats.js";
import { booleanSchema } from "@/src/schemas/boolean-schema.js";
import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";

export async function POST(c: Context) {
  const handler = await ChatHandlerFactory.createStandardChatHandler(c);
  return await handler.handleRequest();
}

export async function PATCH(c: Context) {
  const id = uuidSchema.parse(c.req.query("id"));
  const isFavourite = booleanSchema.parse(c.req.query("fav"));

  const updatedChat = await updateChatFavouriteStatus({
    id,
    isFavourite,
  });

  return c.json(updatedChat);
}

export async function DELETE(c: Context) {
  const id = uuidSchema.parse(c.req.query("id"));

  const user = c.get("user");

  const chat = await getChatById({ id });

  if (chat.userId !== user.id) {
    throw new HTTPException(401, { message: "UNAUTHORIZED" });
  }

  await deleteChatById({ id });

  return c.json("Chat deleted");
}
