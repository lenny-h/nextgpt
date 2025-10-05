import * as z from "zod";

import { itemsPerPageSchema } from "@workspace/api-routes/schemas/items-per-page-schema.js";
import { pageNumberSchema } from "@workspace/api-routes/schemas/page-number-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { chats } from "@workspace/server/drizzle/schema.js";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { validator } from "hono/validator";

const querySchema = z
  .object({
    pageNumber: pageNumberSchema,
    itemsPerPage: itemsPerPageSchema,
  })
  .strict();

const app = new Hono().get(
  "/",
  validator("query", (value) => {
    return querySchema.parse({
      pageNumber: Number(value.pageNumber),
      itemsPerPage: Number(value.itemsPerPage),
    });
  }),
  async (c) => {
    const { pageNumber, itemsPerPage } = c.req.valid("query");
    const user = c.get("user");

    const userChats = await db
      .select()
      .from(chats)
      .where(and(eq(chats.userId, user.id), eq(chats.isFavourite, true)))
      .orderBy(desc(chats.createdAt))
      .limit(itemsPerPage)
      .offset(pageNumber * itemsPerPage);

    return c.json({ userChats });
  }
);

export default app;
