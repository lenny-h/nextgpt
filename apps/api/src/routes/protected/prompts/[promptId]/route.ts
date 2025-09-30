import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { prompts } from "@workspace/server/drizzle/schema.js";
import { and, eq } from "drizzle-orm";
import { type Context } from "hono";
import { patchPromptSchema } from "./schema.js";

export async function PATCH(c: Context) {
  const promptId = uuidSchema.parse(c.req.param("promptId"));

  const payload = await c.req.json();

  const { content } = patchPromptSchema.parse(payload);

  const user = c.get("user");

  await db
    .update(prompts)
    .set({ content })
    .where(and(eq(prompts.id, promptId), eq(prompts.userId, user.id)));

  return c.json("Prompt updated");
}

export async function DELETE(c: Context) {
  const promptId = uuidSchema.parse(c.req.param("promptId"));

  const user = c.get("user");

  await db
    .delete(prompts)
    .where(and(eq(prompts.id, promptId), eq(prompts.userId, user.id)));

  return c.json("Prompt deleted");
}
