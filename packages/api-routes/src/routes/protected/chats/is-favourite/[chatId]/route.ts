import * as z from "zod";

import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { chats } from "@workspace/server/drizzle/schema.js";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { chatsIsFavouriteSchema } from "./schema.js";

const paramSchema = z.object({ chatId: uuidSchema }).strict();

const app = new Hono()
  .get(
    "/",
    validator("param", (value, c) => {
      const parsed = paramSchema.safeParse(value);
      if (!parsed.success) {
        return c.text("BAD_REQUEST", 400);
      }
      return parsed.data;
    }),
    async (c) => {
      const { chatId } = c.req.valid("param");
      const user = c.get("user");

      const result = await db
        .select({ isFavourite: chats.isFavourite })
        .from(chats)
        .where(and(eq(chats.id, chatId), eq(chats.userId, user.id)))
        .limit(1);

      if (result.length === 0) {
        throw new HTTPException(404, { message: "NOT_FOUND" });
      }

      return c.json({ isFavourite: result[0].isFavourite });
    }
  )
  .patch(
    "/",
    validator("param", (value, c) => {
      const parsed = paramSchema.safeParse(value);
      if (!parsed.success) {
        return c.text("BAD_REQUEST", 400);
      }
      return parsed.data;
    }),
    validator("json", async (value, c) => {
      const parsed = chatsIsFavouriteSchema.safeParse(value);
      if (!parsed.success) {
        return c.text("BAD_REQUEST", 400);
      }
      return parsed.data;
    }),
    async (c) => {
      const { chatId } = c.req.valid("param");
      const { isFavourite } = c.req.valid("json");
      const user = c.get("user");

      const result = await db
        .update(chats)
        .set({ isFavourite })
        .where(and(eq(chats.id, chatId), eq(chats.userId, user.id)));

      if (result.rowCount === 0) {
        throw new HTTPException(404, { message: "NOT_FOUND" });
      }

      return c.json({ message: "Chat favourite status updated" });
    }
  );

export default app;
