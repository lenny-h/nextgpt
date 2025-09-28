import { db } from "@/drizzle/db.js";
import { user } from "@/drizzle/schema.js";
import { and, eq, inArray } from "drizzle-orm";

export async function getUserIdsByUsernames(usernames: string[]) {
  return await db
    .select({ id: user.id, username: user.username })
    .from(user)
    .where(and(eq(user.isPublic, true), inArray(user.username, usernames)));
}
