import { getPromptsCount, insertPrompt } from "@/src/lib/db/queries/prompts.js";
import { db } from "@workspace/server/drizzle/db.js";
import { prompts } from "@workspace/server/drizzle/schema.js";
import { eq } from "drizzle-orm";
import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { insertPromptSchema } from "./schema.js";

export async function GET(c: Context) {
  const user = c.get("user");

  const result = await db
    .select({
      id: prompts.id,
      name: prompts.name,
      content: prompts.content,
    })
    .from(prompts)
    .where(eq(prompts.userId, user.id));

  return c.json(result);
}

export async function POST(c: Context) {
  const payload = await c.req.json();

  const { name, content } = insertPromptSchema.parse(payload);

  const user = c.get("user");

  const promptsCount = await getPromptsCount(user.id);

  if (promptsCount >= 6) {
    throw new HTTPException(403, { message: "PROMPT_LIMIT_REACHED" });
  }

  await insertPrompt({
    userId: user.id,
    name,
    content,
  });

  return c.json("Prompt inserted");
}
