import { isBucketMaintainer } from "@/src/lib/db/queries/bucket-maintainers.js";
import {
  filterNonExistingCourseMaintainers,
  isCourseMaintainer,
  removeCourseMaintainersBatch,
} from "@/src/lib/db/queries/course-maintainers.js";
import {
  getBucketIdByCourseId,
  getCourseDetails,
} from "@/src/lib/db/queries/courses.js";
import { addCourseMaintainerInvitationsBatch } from "@/src/lib/db/queries/invitations.js";
import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import { db } from "@workspace/server/drizzle/db.js";
import {
  courseMaintainers,
  user as profile,
} from "@workspace/server/drizzle/schema.js";
import { eq } from "drizzle-orm";
import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { courseMaintainersSchema } from "./schema.js";

// Get course maintainers
export async function GET(c: Context) {
  const courseId = uuidSchema.parse(c.req.param("courseId"));

  const user = c.get("user");

  const bucketId = await getBucketIdByCourseId({ courseId });

  const hasPermissions = await isBucketMaintainer({
    userId: user.id,
    bucketId,
  });

  if (!hasPermissions) {
    throw new HTTPException(403, { message: "FORBIDDEN" });
  }

  const maintainers = await db
    .select({
      userId: courseMaintainers.userId,
      username: profile.username,
    })
    .from(courseMaintainers)
    .innerJoin(profile, eq(courseMaintainers.userId, profile.id))
    .where(eq(courseMaintainers.courseId, courseId));

  return c.json(maintainers);
}

// Invite course maintainers
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
    throw new HTTPException(403, { message: "FORBIDDEN" });
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

  return c.json("Maintainers invited");
}

// Remove course maintainers
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
    throw new HTTPException(403, { message: "FORBIDDEN" });
  }

  const payload = await c.req.json();

  const { userIds } = courseMaintainersSchema.parse(payload);

  if (userIds.includes(user.id)) {
    throw new HTTPException(400, { message: "CANNOT_REMOVE_YOURSELF" });
  }

  await removeCourseMaintainersBatch({
    userIds,
    courseId,
  });

  return c.json("Maintainers removed");
}
