import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import {
  getPromptsCount,
  insertPrompt,
} from "../../../lib/db/queries/prompts.js";
import { insertPromptSchema } from "./schema.js";

export async function POST(c: Context) {
  const payload = await c.req.json();

  const { name, content } = insertPromptSchema.parse(payload);

  const user = c.get("user");

  const promptsCount = await getPromptsCount(user.id);

  if (promptsCount === null || promptsCount >= 4) {
    throw new HTTPException(403, { message: "Prompt limit reached" });
  }

  await insertPrompt({
    userId: user.id,
    name,
    content,
  });

  return c.text("Prompt inserted");
}
