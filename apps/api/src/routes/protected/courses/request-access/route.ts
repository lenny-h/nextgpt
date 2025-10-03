import { validateCourseKey } from "@/src/lib/db/queries/course-keys.js";
import { addUserToCourse } from "@/src/lib/db/queries/course-users.js";
import { type Context } from "hono";
import { requestAccessSchema } from "./schema.js";

export async function POST(c: Context) {
  const payload = await c.req.json();

  const { courseId, key } = requestAccessSchema.parse(payload);

  const user = c.get("user");

  await validateCourseKey({
    courseId,
    key,
  });

  await addUserToCourse({
    courseId,
    userId: user.id,
  });

  return c.json({ message: "Access granted" });
}
