import { type Context } from "hono";
import { checkUserCourseAccess } from "../../../../lib/db/queries/course_users.js";
import { validateAccessSchema } from "./schema.js";

export async function POST(c: Context) {
  const payload = await c.req.json();

  const { courseId } = validateAccessSchema.parse(payload);

  const user = c.get("user");

  const hasAccess = await checkUserCourseAccess({
    courseId,
    userId: user.id,
  });

  return c.json({ hasAccess });
}
