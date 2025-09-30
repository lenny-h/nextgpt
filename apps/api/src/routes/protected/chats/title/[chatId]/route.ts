import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { chats } from "@workspace/server/drizzle/schema.js";
import { and, eq } from "drizzle-orm";
import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { chatsTitleSchema } from "./schema.js";

export async function GET(c: Context) {
  const chatId = uuidSchema.parse(c.req.param("chatId"));

  const user = c.get("user");

  const result = await db
    .select({ title: chats.title })
    .from(chats)
    .where(and(eq(chats.id, chatId), eq(chats.userId, user.id)))
    .limit(1);

  if (result.length === 0) {
    throw new HTTPException(404, { message: "NOT_FOUND" });
  }

  return c.json({ title: result[0].title });
}

export async function PATCH(c: Context) {
  const chatId = uuidSchema.parse(c.req.param("chatId"));

  const payload = await c.req.json();

  const { title } = chatsTitleSchema.parse(payload);

  const user = c.get("user");

  const result = await db
    .update(chats)
    .set({ title })
    .where(and(eq(chats.id, chatId), eq(chats.userId, user.id)));

  if (result.rowCount === 0) {
    throw new HTTPException(404, { message: "NOT_FOUND" });
  }

  return c.json("Chat title updated");
}
