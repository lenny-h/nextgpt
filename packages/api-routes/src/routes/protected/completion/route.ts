import {
  COMPLETION_SYSTEM_PROMPT,
  WORD_COMPLETION_CHECK_PROMPT,
} from "@workspace/api-routes/lib/prompts.js";
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

    // Make two parallel requests: one for completion, one to check if last word is complete
    const [completionResult, wordCheckResult] = await Promise.all([
      generateText({
        system: COMPLETION_SYSTEM_PROMPT,
        model: config.model,
        messages: [{ role: "user", content: context }],
        maxOutputTokens: 64,
      }),
      generateText({
        system: WORD_COMPLETION_CHECK_PROMPT,
        model: config.model,
        messages: [{ role: "user", content: context.slice(-64) }],
        maxOutputTokens: 64,
      }),
    ]);

    const completionText = completionResult.text;
    const isComplete = wordCheckResult.text.toLowerCase().trim() === "complete";

    // If context ends with a complete word (not whitespace) and doesn't already have trailing space,
    // add a space before the completion
    const needsLeadingSpace =
      isComplete && !/\s$/.test(context) && !/^\s/.test(completionText);

    const completion = needsLeadingSpace
      ? ` ${completionText}`
      : completionText;

    return c.json({ completion });
  }
);

export default app;
