import { db } from "@workspace/server/drizzle/db.js";
import { user as profile } from "@workspace/server/drizzle/schema.js";
import { eq } from "drizzle-orm";
import { type Context } from "hono";
import { createProfileSchema } from "./schema.js";

// Get own profile
export async function GET(c: Context) {
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
    return c.json(null);
  }

  return c.json(result[0]);
}

// Update own profile
export async function PATCH(c: Context) {
  const payload = await c.req.json();

  const { name, username, isPublic } = createProfileSchema.parse(payload);

  const user = c.get("user");

  await db
    .update(profile)
    .set({
      name,
      username,
      isPublic,
    })
    .where(eq(profile.id, user.id));

  return c.json("Profile updated");
}
