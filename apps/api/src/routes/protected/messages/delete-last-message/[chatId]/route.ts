import {
  deleteLastMessage,
  isChatOwner,
} from "@/src/lib/db/queries/messages.js";
import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import * as z from "zod";

const paramSchema = z.object({ chatId: uuidSchema }).strict();

const app = new Hono().delete(
  "/",
  validator("param", (value) => {
    return paramSchema.parse(value);
  }),
  async (c) => {
    const { chatId } = c.req.valid("param");
    const user = c.get("user");

    const hasPermission = await isChatOwner({
      userId: user.id,
      chatId,
    });

    if (!hasPermission) {
      throw new HTTPException(403, { message: "FORBIDDEN" });
    }

    await deleteLastMessage({
      chatId,
    });

    return c.json({ message: "Last message deleted" });
  }
);

export default app;
