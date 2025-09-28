import { type Context } from "hono";
import { insertDocument } from "../../../lib/db/queries/documents.js";
import { insertDocumentSchema } from "./schema.js";

export async function POST(c: Context) {
  const payload = await c.req.json();

  const { title, content, kind } = insertDocumentSchema.parse(payload);

  const user = c.get("user");

  await insertDocument({
    userId: user.id,
    title,
    content,
    kind,
  });
}
