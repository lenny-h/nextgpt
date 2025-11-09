import { db } from "@workspace/server/drizzle/db.js";
import { user as profile } from "@workspace/server/drizzle/schema.js";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { createProfileSchema } from "./schema.js";

const app = new Hono()
  .get("/", async (c) => {
    const user = c.get("user");

    const result = await db
      .select({
        name: profile.name,
        username: profile.username,
        isPublic: profile.isPublic,
      })
      .from(profile)
      .where(eq(profile.id, user.id))
      .limit(1);

    if (result.length === 0) {
      return c.json(undefined);
    }

    return c.json(result[0]);
  })
  .patch(
    "/",
    validator("json", async (value, c) => {
      const parsed = createProfileSchema.safeParse(value);
      if (!parsed.success) {
        return c.text("BAD_REQUEST", 400);
      }
      return parsed.data;
    }),
    async (c) => {
      const { name, username, isPublic } = c.req.valid("json");
      const user = c.get("user");

      await db
        .update(profile)
        .set({
          name,
          username,
          isPublic,
        })
        .where(eq(profile.id, user.id));

      return c.json({ message: "Profile updated" });
    }
  );

export default app;
