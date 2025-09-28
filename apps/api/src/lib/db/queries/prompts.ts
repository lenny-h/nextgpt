import { db } from "@/drizzle/db.js";
import { prompts } from "@/drizzle/schema.js";
import { count, eq } from "drizzle-orm";

export async function getPrompt(promptId: string) {
  const result = await db
    .select({ content: prompts.content })
    .from(prompts)
    .where(eq(prompts.id, promptId))
    .limit(1);

  if (result.length === 0) throw new Error("Prompt not found");
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

export async function getPromptsCount(userId: string) {
  const result = await db
    .select({ count: count() })
    .from(prompts)
    .where(eq(prompts.userId, userId));

  return result[0].count;
}
