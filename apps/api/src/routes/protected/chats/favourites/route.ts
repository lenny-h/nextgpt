import { itemsPerPageSchema } from "@/src/schemas/items-per-page-schema.js";
import { pageNumberSchema } from "@/src/schemas/page-number-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { chats } from "@workspace/server/drizzle/schema.js";
import { and, desc, eq } from "drizzle-orm";
import { type Context } from "hono";

export async function GET(c: Context) {
  const pageNumber = pageNumberSchema.parse(Number(c.req.query("pageNumber")));
  const itemsPerPage = itemsPerPageSchema.parse(
    Number(c.req.query("itemsPerPage"))
  );

  const user = c.get("user");

  const userChats = await db
    .select()
    .from(chats)
    .where(and(eq(chats.userId, user.id), eq(chats.isFavourite, true)))
    .orderBy(desc(chats.createdAt))
    .limit(itemsPerPage)
    .offset(pageNumber * itemsPerPage);

  return c.json(userChats);
}
