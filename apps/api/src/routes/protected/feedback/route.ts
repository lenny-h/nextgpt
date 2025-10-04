import { db } from "@workspace/server/drizzle/db.js";
import { feedback } from "@workspace/server/drizzle/schema.js";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { feedbackSchema } from "./schema.js";

const app = new Hono().post(
  "/",
  validator("json", async (value) => {
    return feedbackSchema.parse(value);
  }),
  async (c) => {
    const { subject, content } = c.req.valid("json");
    const user = c.get("user");

    await db.insert(feedback).values({
      userId: user.id,
      subject,
      content,
    });

    return c.json({ message: "Feedback inserted" });
  }
);

export default app;
