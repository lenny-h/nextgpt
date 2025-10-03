import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { chats } from "@workspace/server/drizzle/schema.js";
import { and, eq } from "drizzle-orm";
import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";

export async function GET(c: Context) {
  const chatId = uuidSchema.parse(c.req.param("chatId"));

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

export async function DELETE(c: Context) {
  const chatId = uuidSchema.parse(c.req.param("chatId"));

  const user = c.get("user");

  const result = await db
    .delete(chats)
    .where(and(eq(chats.id, chatId), eq(chats.userId, user.id)));

  if (result.rowCount === 0) {
    throw new HTTPException(404, { message: "NOT_FOUND" });
  }

  return c.json({ message: "Chat deleted" });
}
