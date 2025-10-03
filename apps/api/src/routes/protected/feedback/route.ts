import { db } from "@workspace/server/drizzle/db.js";
import { feedback } from "@workspace/server/drizzle/schema.js";
import { type Context } from "hono";
import { feedbackSchema } from "./schema.js";

export async function POST(c: Context) {
  const payload = await c.req.json();

  const { subject, content } = feedbackSchema.parse(payload);

  const user = c.get("user");

  await db.insert(feedback).values({
    userId: user.id,
    subject,
    content,
  });

  return c.json({ message: "Feedback inserted" });
}
