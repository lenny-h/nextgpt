import { ChatHandlerFactory } from "@/src/lib/chat/index.js";
import {
  deleteChatById,
  getChatById,
  updateChatFavouriteStatus,
} from "@/src/lib/db/queries/chats.js";
import { booleanSchema } from "@/src/schemas/boolean-schema.js";
import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import * as z from "zod";

const patchQuerySchema = z
  .object({
    id: uuidSchema,
    fav: booleanSchema,
  })
  .strict();

const deleteQuerySchema = z
  .object({
    id: uuidSchema,
  })
  .strict();

const app = new Hono()
  .post("/", async (c) => {
    const handler = await ChatHandlerFactory.createStandardChatHandler(c);
    return await handler.handleRequest();
  })
  .patch(
    "/",
    validator("query", (value) => {
      return patchQuerySchema.parse(value);
    }),
    async (c) => {
      const { id, fav: isFavourite } = c.req.valid("query");

      const updatedChat = await updateChatFavouriteStatus({
        id,
        isFavourite,
      });

      return c.json({ updatedChat });
    }
  )
  .delete(
    "/",
    validator("query", (value) => {
      return deleteQuerySchema.parse(value);
    }),
    async (c) => {
      const { id } = c.req.valid("query");
      const user = c.get("user");

      const chat = await getChatById({ id });

      if (chat.userId !== user.id) {
        throw new HTTPException(401, { message: "UNAUTHORIZED" });
      }

      await deleteChatById({ id });

      return c.json({ message: "Chat deleted" });
    }
  );

export default app;
