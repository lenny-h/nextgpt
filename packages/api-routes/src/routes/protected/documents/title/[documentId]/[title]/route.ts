import * as z from "zod";

import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { documents } from "@workspace/server/drizzle/schema.js";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { documentsTitleSchema } from "./schema.js";

const paramSchema = z
  .object({
    documentId: uuidSchema,
    title: documentsTitleSchema,
  })
  .strict();

const app = new Hono().patch(
  "/",
  validator("param", (value, c) => {
    const parsed = paramSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }
    return parsed.data;
  }),
  async (c) => {
    const { documentId, title } = c.req.valid("param");
    const user = c.get("user");

    await db
      .update(documents)
      .set({ title })
      .where(and(eq(documents.id, documentId), eq(documents.userId, user.id)));

    return c.json({ message: "Document title updated" });
  }
);

export default app;
