import * as z from "zod";

import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { documents } from "@workspace/server/drizzle/schema.js";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const paramSchema = z.object({ documentId: uuidSchema }).strict();

const app = new Hono()
  .get(
    "/",
    validator("param", (value, c) => {
      const parsed = paramSchema.safeParse(value);
      if (!parsed.success) {
        return c.text("BAD_REQUEST", 400);
      }
      return parsed.data;
    }),
    async (c) => {
      const { documentId } = c.req.valid("param");
      const user = c.get("user");

      const result = await db
        .select({
          content: documents.content,
        })
        .from(documents)
        .where(and(eq(documents.id, documentId), eq(documents.userId, user.id)))
        .limit(1);

      if (result.length === 0) {
        throw new HTTPException(404, { message: "NOT_FOUND" });
      }

      return c.json(result[0]);
    }
  )
  .delete(
    "/",
    validator("param", (value, c) => {
      const parsed = paramSchema.safeParse(value);
      if (!parsed.success) {
        return c.text("BAD_REQUEST", 400);
      }
      return parsed.data;
    }),
    async (c) => {
      const { documentId } = c.req.valid("param");
      const user = c.get("user");

      const result = await db
        .delete(documents)
        .where(
          and(eq(documents.id, documentId), eq(documents.userId, user.id))
        )
        .returning({ id: documents.id });

      if (result.length === 0) {
        throw new HTTPException(404, { message: "NOT_FOUND" });
      }

      return c.json({ message: "Document deleted" });
    }
  );

export default app;
