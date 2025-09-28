import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { isBucketMaintainer } from "../../../../lib/db/queries/bucket-maintainers.js";
import {
  filterNonExistingCourseMaintainers,
  removeCourseMaintainersBatch,
} from "../../../../lib/db/queries/course-maintainers.js";
import { getCourseDetails } from "../../../../lib/db/queries/courses.js";
import { addCourseMaintainerInvitationsBatch } from "../../../../lib/db/queries/invitations.js";
import { uuidSchema } from "../../../../schemas/uuid-schema.js";
import { courseMaintainersSchema } from "./schema.js";

export async function POST(c: Context) {
  const courseId = uuidSchema.parse(c.req.param("courseId"));

  const user = c.get("user");

  const { bucketId, name } = await getCourseDetails({
    courseId,
  });

  const hasPermissions = await isBucketMaintainer({
    userId: user.id,
    bucketId,
  });

  if (!hasPermissions) {
    return new Response("Forbidden", { status: 403 });
  }

  const payload = await c.req.json();

  const { userIds } = courseMaintainersSchema.parse(payload);

  const newMaintainers = await filterNonExistingCourseMaintainers({
    courseId,
    userIds,
  });

  await addCourseMaintainerInvitationsBatch({
    originUserId: user.id,
    invitations: newMaintainers,
    courseId,
    courseName: name,
  });

  return c.text("Maintainers invited");
}

export async function DELETE(c: Context) {
  const courseId = uuidSchema.parse(c.req.param("courseId"));

  const user = c.get("user");

  const { bucketId } = await getCourseDetails({
    courseId,
  });

  const hasPermissions = await isBucketMaintainer({
    userId: user.id,
    bucketId,
  });

  if (!hasPermissions) {
    throw new HTTPException(403, { message: "Forbidden" });
  }

  const payload = await c.req.json();

  const { userIds } = courseMaintainersSchema.parse(payload);

  if (userIds.includes(user.id)) {
    throw new HTTPException(400, { message: "You cannot remove yourself" });
  }

  await removeCourseMaintainersBatch({
    userIds,
    courseId,
  });

  return c.text("Maintainers removed");
}
