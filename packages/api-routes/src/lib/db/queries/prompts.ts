import { db } from "@workspace/server/drizzle/db.js";
import { prompts } from "@workspace/server/drizzle/schema.js";
import { and, count, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

export async function getPrompt(promptId: string) {
  const result = await db
    .select({ content: prompts.content })
    .from(prompts)
    .where(eq(prompts.id, promptId))
    .limit(1);

  if (result.length === 0) {
    throw new HTTPException(404, { message: "NOT_FOUND" });
  }
  return result[0].content;
}

export async function insertPrompt({
  userId,
  name,
  content,
}: {
  userId: string;
  name: string;
  content: string;
}) {
  await db.insert(prompts).values({
    userId,
    name,
    content,
  });
}

export async function deletePrompt({
  userId,
  promptId,
}: {
  userId: string;
  promptId: string;
}) {
  const result = await db
    .delete(prompts)
    .where(and(eq(prompts.id, promptId), eq(prompts.userId, userId)))
    .returning({ name: prompts.name });

  if (result.length === 0) {
    throw new HTTPException(404, { message: "NOT_FOUND" });
  }
  return result[0].name;
}

export async function getPromptsCount(userId: string) {
  const result = await db
    .select({ count: count() })
    .from(prompts)
    .where(eq(prompts.userId, userId));

  return result[0].count;
}
