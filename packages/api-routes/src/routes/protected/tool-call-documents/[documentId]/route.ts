import * as z from "zod";

import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import {
  documents,
  toolCallDocuments,
} from "@workspace/server/drizzle/schema.js";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";

const paramSchema = z
  .object({
    documentId: uuidSchema,
    fetchDocument: z.preprocess((val) => {
      if (typeof val === "string") {
        const v = val.toLowerCase();
        if (v === "true" || v === "1") return true;
        if (v === "false" || v === "0") return false;
      }
      return val;
    }, z.boolean().optional().default(false)),
  })
  .strict();

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
    const { documentId, fetchDocument } = c.req.valid("param");
    const user = c.get("user");

    // Fetch the document tool call
    const toolCallResult = await db
      .select({
        id: toolCallDocuments.id,
        title: toolCallDocuments.title,
        content: toolCallDocuments.content,
        kind: toolCallDocuments.kind,
        createdAt: toolCallDocuments.createdAt,
      })
      .from(toolCallDocuments)
      .where(
        and(
          eq(toolCallDocuments.id, documentId),
          eq(toolCallDocuments.userId, user.id)
        )
      )
      .limit(1);

    if (toolCallResult.length === 0) {
      throw new HTTPException(404, { message: "NOT_FOUND" });
    }

    if (!fetchDocument) {
      return c.json({
        toolCallDocument: toolCallResult[0],
        existingDocument: null,
      });
    }

    // Try to fetch the corresponding document from the documents table
    const documentResult = await db
      .select({
        content: documents.content,
      })
      .from(documents)
      .where(and(eq(documents.id, documentId), eq(documents.userId, user.id)))
      .limit(1);

    return c.json({
      toolCallDocument: toolCallResult[0],
      existingDocument: documentResult.length > 0 ? documentResult[0] : null,
    });
  }
);

export default app;
