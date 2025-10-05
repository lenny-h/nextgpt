import { checkUserCourseAccess } from "@workspace/api-routes/lib/db/queries/course-users.js";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { validateAccessSchema } from "./schema.js";

const app = new Hono().post(
  "/",
  validator("json", async (value) => {
    return validateAccessSchema.parse(value);
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
