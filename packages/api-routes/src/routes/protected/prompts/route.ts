import {
  getPromptsCount,
  insertPrompt,
} from "@workspace/api-routes/lib/db/queries/prompts.js";
import { db } from "@workspace/server/drizzle/db.js";
import { prompts } from "@workspace/server/drizzle/schema.js";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { insertPromptSchema } from "./schema.js";

const app = new Hono()
  .get("/", async (c) => {
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
  })
  .post(
    "/",
    validator("json", async (value, c) => {
      return insertPromptSchema.parse(value);
    }),
    async (c) => {
      const { name, content } = c.req.valid("json");
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

      return c.json({ message: "Prompt inserted" });
    }
  );

export default app;
