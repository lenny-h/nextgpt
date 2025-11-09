import * as z from "zod";

import { saveDocument } from "@workspace/api-routes/lib/db/queries/documents.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { documentsContentSchema } from "./schema.js";

const paramSchema = z.object({ documentId: uuidSchema }).strict();

const app = new Hono().patch(
  "/",
  validator("param", (value, c) => {
    const parsed = paramSchema.safeParse(value);
    if (!parsed.success) {
      return c.text("BAD_REQUEST", 400);
    }
    return parsed.data;
  }),
  validator("json", async (value, c) => {
    const parsed = documentsContentSchema.safeParse(value);
    if (!parsed.success) {
      return c.text("BAD_REQUEST", 400);
    }
    return parsed.data;
  }),
  async (c) => {
    const { documentId } = c.req.valid("param");
    const { content } = c.req.valid("json");
    const user = c.get("user");

    await saveDocument({
      userId: user.id,
      id: documentId,
      content,
    });

    return c.json({ message: "Document saved" });
  }
);

export default app;
