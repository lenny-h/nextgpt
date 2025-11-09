import * as z from "zod";

import { deletePrompt } from "@workspace/api-routes/lib/db/queries/prompts.js";
import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { prompts } from "@workspace/server/drizzle/schema.js";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { patchPromptSchema } from "./schema.js";

const paramSchema = z.object({ promptId: uuidSchema }).strict();

const app = new Hono()
  .patch(
    "/",
    validator("param", (value, c) => {
      const parsed = paramSchema.safeParse(value);
      if (!parsed.success) {
        return c.text("BAD_REQUEST", 400);
      }
      return parsed.data;
    }),
    validator("json", async (value, c) => {
      const parsed = patchPromptSchema.safeParse(value);
      if (!parsed.success) {
        return c.text("BAD_REQUEST", 400);
      }
      return parsed.data;
    }),
    async (c) => {
      const { promptId } = c.req.valid("param");
      const { content } = c.req.valid("json");
      const user = c.get("user");

      await db
        .update(prompts)
        .set({ content })
        .where(and(eq(prompts.id, promptId), eq(prompts.userId, user.id)));

      return c.json({ message: "Prompt updated" });
    }
  )
  .delete(
    "/",
    validator("param", (value, c) => {
      const parsed = paramSchema.safeParse(value);
      if (!parsed.success) {
        return c.text("BAD_REQUEST", 400);
      }
      return parsed.data;
    }),
    async (c) => {
      const { promptId } = c.req.valid("param");
      const user = c.get("user");

      const deletedPrompt = await deletePrompt({ userId: user.id, promptId });

      return c.json({ name: deletedPrompt });
    }
  );

export default app;
