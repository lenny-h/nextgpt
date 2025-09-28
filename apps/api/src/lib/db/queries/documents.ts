import { db } from "@/drizzle/db.js";
import { documents } from "@/drizzle/schema.js";
import { type ArtifactKind } from "@/src/types/artifact-kind.js";
import { and, eq } from "drizzle-orm";

export async function getDocument({ id }: { id: string }) {
  const result = await db
    .select({
      userId: documents.userId,
      title: documents.title,
      content: documents.content,
      kind: documents.kind,
    })
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1);

  if (result.length === 0) throw new Error("Not found");
  return { id, ...result[0] };
}

export async function insertDocument({
  userId,
  title,
  content,
  kind,
}: {
  userId: string;
  title: string;
  content: string;
  kind: ArtifactKind;
}) {
  const existingDoc = await db
    .select({ id: documents.id })
    .from(documents)
    .where(and(eq(documents.userId, userId), eq(documents.title, title)))
    .limit(1);

  if (existingDoc.length > 0) {
    // Update existing document
    const result = await db
      .update(documents)
      .set({
        content,
        kind,
        createdAt: new Date(),
      })
      .where(eq(documents.id, existingDoc[0].id))
      .returning();

    return result;
  } else {
    // Insert new document
    const result = await db
      .insert(documents)
      .values({
        userId,
        title,
        content,
        kind,
      })
      .returning();

    return result;
  }
}

export async function saveDocument({
  userId,
  id,
  content,
}: {
  userId: string;
  id: string;
  content: string;
}) {
  const result = await db
    .update(documents)
    .set({
      content,
      createdAt: new Date(),
    })
    .where(and(eq(documents.id, id), eq(documents.userId, userId)))
    .returning();

  return result;
}
