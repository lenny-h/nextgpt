import { saveDocument } from "@/src/lib/db/queries/documents.js";
import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { type Context } from "hono";
import { documentsContentSchema } from "./schema.js";

export async function PATCH(c: Context) {
  const documentId = uuidSchema.parse(c.req.param("documentId"));

  const payload = await c.req.json();

  const { content } = documentsContentSchema.parse(payload);

  const user = c.get("user");

  await saveDocument({
    userId: user.id,
    id: documentId,
    content,
  });

  return c.json({ message: "Document saved" });
}
