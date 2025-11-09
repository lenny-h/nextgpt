import * as z from "zod";

import { COMPLETION_SYSTEM_PROMPT } from "@workspace/api-routes/lib/prompts.js";
import { getModel } from "@workspace/api-routes/lib/providers.js";
import { completionModelIdx } from "@workspace/api-routes/utils/models.js";
import { generateObject } from "ai";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { completionSchema } from "./schema.js";

const completionResponseSchema = z.object({
  completion: z.string(),
});

const app = new Hono().post(
  "/",
  validator("json", async (value, c) => {
    const parsed = completionSchema.safeParse(value);
    if (!parsed.success) {
      return c.text("BAD_REQUEST", 400);
    }
    return parsed.data;
  }),
  async (c) => {
    const { context } = c.req.valid("json");

    const config = await getModel(completionModelIdx);

    const { object } = await generateObject({
      system: COMPLETION_SYSTEM_PROMPT,
      model: config.model,
      messages: [{ role: "user", content: context }],
      schema: completionResponseSchema,
      maxOutputTokens: 64,
    });

    return c.json({ completion: object.completion });
  }
);

export default app;
