import { checkUserCourseAccess } from "@/src/lib/db/queries/course-users.js";
import { type Context } from "hono";
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
