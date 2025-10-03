import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { chats } from "@workspace/server/drizzle/schema.js";
import { and, eq } from "drizzle-orm";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { chatsIsFavouriteSchema } from "./schema.js";

export async function GET(c: Context) {
  const chatId = uuidSchema.parse(c.req.param("chatId"));

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

export async function PATCH(c: Context) {
  const chatId = uuidSchema.parse(c.req.param("chatId"));

  const payload = await c.req.json();

  const { isFavourite } = chatsIsFavouriteSchema.parse(payload);

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
