import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { chats } from "@workspace/server/drizzle/schema.js";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import * as z from "zod";

const paramSchema = z.object({ chatId: uuidSchema }).strict();

const app = new Hono()
  .get(
    "/",
    validator("param", (value) => {
      return paramSchema.parse(value);
    }),
    async (c) => {
      const { chatId } = c.req.valid("param");
      const user = c.get("user");

      const result = await db
        .select()
        .from(chats)
        .where(and(eq(chats.id, chatId), eq(chats.userId, user.id)))
        .limit(1);

      if (result.length === 0) {
        throw new HTTPException(404, { message: "NOT_FOUND" });
      }

      return c.json({ chat: result[0] });
    }
  )
  .delete(
    "/",
    validator("param", (value) => {
      return paramSchema.parse(value);
    }),
    async (c) => {
      const { chatId } = c.req.valid("param");
      const user = c.get("user");

      const result = await db
        .delete(chats)
        .where(and(eq(chats.id, chatId), eq(chats.userId, user.id)));

      if (result.rowCount === 0) {
        throw new HTTPException(404, { message: "NOT_FOUND" });
      }

      return c.json({ message: "Chat deleted" });
    }
  );

export default app;
