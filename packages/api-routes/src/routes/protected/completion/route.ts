import { COMPLETION_SYSTEM_PROMPT } from "@workspace/api-routes/lib/prompts.js";
import { getModel } from "@workspace/api-routes/lib/providers.js";
import { completionModelIdx } from "@workspace/api-routes/utils/models.js";
import { generateText } from "ai";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { completionSchema } from "./schema.js";

const app = new Hono().post(
  "/",
  validator("json", async (value, c) => {
    const parsed = completionSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }
    return parsed.data;
  }),
  async (c) => {
    const { context } = c.req.valid("json");

    const config = await getModel(completionModelIdx);

    const { text } = await generateText({
      system: COMPLETION_SYSTEM_PROMPT,
      model: config.model,
      messages: [{ role: "user", content: context }],
      maxOutputTokens: 64,
    });

    return c.json({ completion: text });
  }
);

export default app;
