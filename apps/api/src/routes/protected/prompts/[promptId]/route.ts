import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import { prompts } from "@workspace/server/drizzle/schema.js";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { validator } from "hono/validator";
import * as z from "zod";
import { patchPromptSchema } from "./schema.js";

const paramSchema = z.object({ promptId: uuidSchema }).strict();

const app = new Hono()
  .patch(
    "/",
    validator("param", (value) => {
      return paramSchema.parse(value);
    }),
    validator("json", async (value, c) => {
      return patchPromptSchema.parse(value);
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
    validator("param", (value) => {
      return paramSchema.parse(value);
    }),
    async (c) => {
      const { promptId } = c.req.valid("param");
      const user = c.get("user");

      await db
        .delete(prompts)
        .where(and(eq(prompts.id, promptId), eq(prompts.userId, user.id)));

      return c.json({ message: "Prompt deleted" });
    }
  );

export default app;
