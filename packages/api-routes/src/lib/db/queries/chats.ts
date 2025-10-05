import { db } from "@workspace/server/drizzle/db.js";
import { chats } from "@workspace/server/drizzle/schema.js";
import { and, desc, eq, lt } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

export async function getChatById({ id }: { id: string }) {
  const result = await db.select().from(chats).where(eq(chats.id, id)).limit(1);

  if (result.length === 0) {
    throw new HTTPException(404, { message: "NOT_FOUND" });
  }
  return result[0];
}

export async function getFavouriteChatsByUserId({
  id,
  cursor,
}: {
  id: string;
  cursor: string | null;
}) {
  const baseWhere = cursor
    ? and(
        eq(chats.userId, id),
        eq(chats.isFavourite, true),
        lt(chats.createdAt, new Date(cursor))
      )
    : and(eq(chats.userId, id), eq(chats.isFavourite, true));

  const query = db
    .select()
    .from(chats)
    .where(baseWhere)
    .orderBy(desc(chats.createdAt))
    .limit(10);

  return await query;
}

export async function updateChatFavouriteStatus({
  id,
  isFavourite,
}: {
  id: string;
  isFavourite: boolean;
}) {
  const result = await db
    .update(chats)
    .set({ isFavourite })
    .where(eq(chats.id, id))
    .returning();

  if (result.length === 0) {
    throw new HTTPException(404, { message: "NOT_FOUND" });
  }
  return result[0];
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  const result = await db
    .insert(chats)
    .values({
      id,
      userId,
      title,
    })
    .returning();

  const data = result[0];
  return {
    ...data,
    created_at: new Date(data.createdAt).toLocaleString(),
  };
}

export async function deleteChatById({ id }: { id: string }) {
  await db.delete(chats).where(eq(chats.id, id));
}

export async function isChatOwner({
  userId,
  chatId,
}: {
  userId: string;
  chatId: string;
}) {
  const result = await db
    .select({ userId: chats.userId })
    .from(chats)
    .where(eq(chats.id, chatId))
    .limit(1);

  if (result.length === 0) {
    throw new HTTPException(404, { message: "NOT_FOUND" });
  }
  return result[0].userId === userId;
}
