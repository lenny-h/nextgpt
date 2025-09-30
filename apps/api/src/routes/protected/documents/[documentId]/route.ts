import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { documents } from "@workspace/server/drizzle/schema.js";
import { and, eq } from "drizzle-orm";
import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";

export async function GET(c: Context) {
  const documentId = uuidSchema.parse(c.req.param("documentId"));

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

export async function DELETE(c: Context) {
  const documentId = uuidSchema.parse(c.req.param("documentId"));

  const user = c.get("user");

  await db
    .delete(documents)
    .where(and(eq(documents.id, documentId), eq(documents.userId, user.id)));

  return c.json("Document deleted");
}
