import * as z from "zod";

import { ChatHandlerFactory } from "@workspace/api-routes/lib/chat/index.js";
import {
  deleteChatById,
  getChatById,
  updateChatFavouriteStatus,
} from "@workspace/api-routes/lib/db/queries/chats.js";
import { booleanSchema } from "@workspace/api-routes/schemas/boolean-schema.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

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
    validator("query", (value, c) => {
      const parsed = patchQuerySchema.safeParse(value);
      if (!parsed.success) {
        throw new HTTPException(400, { message: "BAD_REQUEST" });
      }
      return parsed.data;
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
    validator("query", (value, c) => {
      const parsed = deleteQuerySchema.safeParse(value);
      if (!parsed.success) {
        throw new HTTPException(400, { message: "BAD_REQUEST" });
      }
      return parsed.data;
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
