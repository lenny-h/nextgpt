import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { isBucketMaintainer } from "../../../lib/db/queries/bucket-maintainers.js";
import { createCourse } from "../../../lib/db/queries/courses.js";
import { encryptApiKey } from "../../../utils/encryption.js";
import { createCourseSchema } from "./schema.js";

export async function POST(c: Context) {
  const payload = await c.req.json();

  const { values } = createCourseSchema.parse(payload);

  const user = c.get("user");

  const bucketId = values.bucketId;
  const hasPermissions = await isBucketMaintainer({
    userId: user.id,
    bucketId,
  });

  if (!hasPermissions) {
    throw new HTTPException(403, { message: "Forbidden" });
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

  return c.text("Course created");
}
