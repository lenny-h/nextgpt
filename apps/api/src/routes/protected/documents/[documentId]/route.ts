import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { documents } from "@workspace/server/drizzle/schema.js";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import * as z from "zod";

const paramSchema = z.object({ documentId: uuidSchema }).strict();

const app = new Hono()
  .get(
    "/",
    validator("param", (value) => {
      return paramSchema.parse(value);
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

      return c.json({ document: result[0] });
    }
  )
  .delete(
    "/",
    validator("param", (value) => {
      return paramSchema.parse(value);
    }),
    async (c) => {
      const { documentId } = c.req.valid("param");
      const user = c.get("user");

      await db
        .delete(documents)
        .where(
          and(eq(documents.id, documentId), eq(documents.userId, user.id))
        );

      return c.json({ message: "Document deleted" });
    }
  );

export default app;
