import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { documents } from "@workspace/server/drizzle/schema.js";
import { and, eq } from "drizzle-orm";
import { type Context } from "hono";
import { documentsTitleSchema } from "./schema.js";

export async function PATCH(c: Context) {
  const documentId = uuidSchema.parse(c.req.param("documentId"));

  const payload = await c.req.json();

  const { title } = documentsTitleSchema.parse(payload);

  const user = c.get("user");

  await db
    .update(documents)
    .set({ title })
    .where(and(eq(documents.id, documentId), eq(documents.userId, user.id)));

  return c.json("Document title updated");
}
