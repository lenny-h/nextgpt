import { isChatOwner } from "@/src/lib/db/queries/chats.js";
import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { messages } from "@workspace/server/drizzle/schema.js";
import { asc, eq } from "drizzle-orm";
import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";

export async function GET(c: Context) {
  const chatId = uuidSchema.parse(c.req.param("chatId"));

  const user = c.get("user");

  const hasPermissions = await isChatOwner({ chatId, userId: user.id });

  if (!hasPermissions) {
    throw new HTTPException(403, { message: "FORBIDDEN" });
  }

  const result = await db
    .select({
      id: messages.id,
      role: messages.role,
      parts: messages.parts,
      metadata: messages.metadata,
    })
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(asc(messages.createdAt));

  return c.json({ messages: result });
}
