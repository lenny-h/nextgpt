import { vertex } from "@ai-sdk/google-vertex";
import { generateObject } from "ai";
import { type Context } from "hono";
import { z } from "zod";
import { COMPLETION_SYSTEM_PROMPT } from "../../../lib/prompts.js";
import { completionSchema } from "./schema.js";

const completionResponseSchema = z.object({
  completion: z.string(),
});

export async function POST(c: Context) {
  const payload = await c.req.json();

  const { context } = completionSchema.parse(payload);

  const { object } = await generateObject({
    system: COMPLETION_SYSTEM_PROMPT,
    model: vertex("gemini-2.0-flash-001"),
    messages: [{ role: "user", content: context }],
    schema: completionResponseSchema,
    maxOutputTokens: 60,
  });

  return c.json({
    res: object.completion,
  });
}
