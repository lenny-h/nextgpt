import * as z from "zod";

import { isChatOwner } from "@workspace/api-routes/lib/db/queries/chats.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { messages } from "@workspace/server/drizzle/schema.js";
import { asc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const paramSchema = z.object({ chatId: uuidSchema }).strict();

const app = new Hono().get(
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

    const hasPermissions = await isChatOwner({ chatId, userId: user.id });

    if (!hasPermissions) {
      throw new HTTPException(404, { message: "NOT_FOUND" });
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

    return c.json(result);
  }
);

export default app;
