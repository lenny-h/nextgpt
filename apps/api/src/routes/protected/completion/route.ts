import { vertex } from "@ai-sdk/google-vertex";
import { generateObject } from "ai";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { z } from "zod";
import { COMPLETION_SYSTEM_PROMPT } from "@/src/lib/prompts.js";
import { completionSchema } from "./schema.js";

const completionResponseSchema = z.object({
  completion: z.string(),
});

const app = new Hono().post(
  "/",
  validator("json", async (value) => {
    return completionSchema.parse(value);
  }),
  async (c) => {
    const { context } = c.req.valid("json");

    const { object } = await generateObject({
      system: COMPLETION_SYSTEM_PROMPT,
      model: vertex("gemini-2.0-flash-001"),
      messages: [{ role: "user", content: context }],
      schema: completionResponseSchema,
      maxOutputTokens: 60,
    });

    return c.json({ completion: object.completion });
  }
);

export default app;
