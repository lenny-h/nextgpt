import { checkUserCourseAccess } from "@workspace/api-routes/lib/db/queries/course-users.js";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { validateAccessSchema } from "./schema.js";

const app = new Hono().post(
  "/",
  validator("json", async (value, c) => {
    const parsed = validateAccessSchema.safeParse(value);
    if (!parsed.success) {
      return c.text("BAD_REQUEST", 400);
    }
    return parsed.data;
  }),
  async (c) => {
    const { courseId } = c.req.valid("json");
    const user = c.get("user");

    const hasAccess = await checkUserCourseAccess({
      courseId,
      userId: user.id,
    });

    return c.json({ hasAccess });
  }
);

export default app;
