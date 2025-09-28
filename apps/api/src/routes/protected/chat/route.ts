import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { ChatHandlerFactory } from "../../../lib/chat/index.js";
import {
  deleteChatById,
  getChatById,
  updateChatFavouriteStatus,
} from "../../../lib/db/queries/chats.js";

export async function POST(c: Context) {
  const handler = await ChatHandlerFactory.createStandardChatHandler(c);
  return await handler.handleRequest();
}

export async function PATCH(c: Context) {
  const id = c.req.query("id");
  const isFavourite = c.req.query("fav");

  if (!id) {
    throw new HTTPException(404, { message: "Not Found" });
  }

  if (isFavourite !== "true" && isFavourite !== "false") {
    throw new HTTPException(400, { message: "Invalid 'fav' query parameter" });
  }

  const updatedChat = await updateChatFavouriteStatus({
    id,
    isFavourite: isFavourite === "true",
  });

  return c.json(updatedChat);
}

export async function DELETE(c: Context) {
  const id = c.req.query("id");

  if (!id) {
    throw new HTTPException(404, { message: "Not Found" });
  }

  const user = c.get("user");

  const chat = await getChatById({ id });

  if (chat.user_id !== user.id) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  await deleteChatById({ id });

  return c.text("Chat deleted");
}
