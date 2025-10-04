import { isBucketMaintainer } from "@/src/lib/db/queries/bucket-maintainers.js";
import { createCourse } from "@/src/lib/db/queries/courses.js";
import { encryptApiKey } from "@/src/utils/encryption.js";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { createCourseSchema } from "./schema.js";

const app = new Hono().post(
  "/",
  validator("json", async (value) => {
    return createCourseSchema.parse(value);
  }),
  async (c) => {
    const { values } = c.req.valid("json");
    const user = c.get("user");

    const bucketId = values.bucketId;
    const hasPermissions = await isBucketMaintainer({
      userId: user.id,
      bucketId,
    });

    if (!hasPermissions) {
      throw new HTTPException(403, { message: "FORBIDDEN" });
    }

    // Encrypt password if provided
    const encryptedKey = values.password
      ? encryptApiKey(values.password)
      : undefined;

    await createCourse({
      name: values.courseName,
      description: values.courseDescription,
      bucketId: bucketId,
      userId: user.id,
      encryptedKey,
    });

    return c.json({ message: "Course created" });
  }
);

export default app;
