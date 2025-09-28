import { type Context } from "hono";
import { validateCourseKey } from "../../../../lib/db/queries/course-keys.js";
import { addUserToCourse } from "../../../../lib/db/queries/course-users.js";
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

  return c.text("Access granted");
}
