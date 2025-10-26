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
  validator("json", async (value) => {
    return completionSchema.parse(value);
  }),
  async (c) => {
    const { context } = c.req.valid("json");

    const config = await getModel(completionModelIdx);

    const { object } = await generateObject({
      system: COMPLETION_SYSTEM_PROMPT,
      model: config.model,
      messages: [{ role: "user", content: context }],
      schema: completionResponseSchema,
      maxOutputTokens: 60,
    });

    return c.json({ completion: object.completion });
  }
);

export default app;
