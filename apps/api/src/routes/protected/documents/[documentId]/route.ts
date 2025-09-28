import { type Context } from "hono";
import { saveDocument } from "../../../../lib/db/queries/documents.js";
import { uuidSchema } from "../../../../schemas/uuid-schema.js";
import { saveDocumentSchema } from "./schema.js";

export async function PATCH(c: Context) {
  const documentId = uuidSchema.parse(c.req.param("documentId"));

  const payload = await c.req.json();

  const { content } = saveDocumentSchema.parse(payload);

  const user = c.get("user");

  await saveDocument({
    userId: user.id,
    id: documentId,
    content,
  });
}
