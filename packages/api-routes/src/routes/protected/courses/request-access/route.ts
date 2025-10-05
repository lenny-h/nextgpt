import { validateCourseKey } from "@workspace/api-routes/lib/db/queries/course-keys.js";
import { addUserToCourse } from "@workspace/api-routes/lib/db/queries/course-users.js";
import { Hono } from "hono";
import { validator } from "hono/validator";
import { requestAccessSchema } from "./schema.js";

const app = new Hono().post(
  "/",
  validator("json", async (value) => {
    return requestAccessSchema.parse(value);
  }),
  async (c) => {
    const { courseId, key } = c.req.valid("json");
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
);

export default app;
