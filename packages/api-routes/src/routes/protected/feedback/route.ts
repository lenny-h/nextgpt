import { db } from "@workspace/server/drizzle/db.js";
import { feedback } from "@workspace/server/drizzle/schema.js";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { feedbackSchema } from "./schema.js";

const app = new Hono().post(
  "/",
  validator("json", async (value, c) => {
    const parsed = feedbackSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }
    return parsed.data;
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
