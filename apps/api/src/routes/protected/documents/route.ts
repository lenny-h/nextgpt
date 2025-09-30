import { insertDocument } from "@/src/lib/db/queries/documents.js";
import { type Context } from "hono";
import { insertDocumentSchema } from "./schema.js";
import { pageNumberSchema } from "@/src/schemas/page-number-schema.js";
import { itemsPerPageSchema } from "@/src/schemas/items-per-page-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { documents } from "@workspace/server/drizzle/schema.js";
import { eq, sql } from "drizzle-orm";

export async function GET(c: Context) {
  const pageNumber = pageNumberSchema.parse(c.req.query("pageNumber"));
  const itemsPerPage = itemsPerPageSchema.parse(c.req.query("itemsPerPage"));

  const user = c.get("user");

  const result = await db
    .select({
      id: documents.id,
      title: documents.title,
      content: sql`SUBSTRING(${documents.content}, 1, 50)`.as("content"),
      kind: documents.kind,
      createdAt: documents.createdAt,
    })
    .from(documents)
    .where(eq(documents.userId, user.id))
    .limit(itemsPerPage)
    .offset(pageNumber * itemsPerPage);

  return c.json(result);
}

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

  return c.json("Document inserted");
}
