import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import {
  acceptBucketMaintainerInvitation,
  acceptCourseMaintainerInvitation,
  acceptUserInvitation,
} from "@/src/lib/db/queries/invitations.js";
import { acceptInvitationSchema } from "./schema.js";

export async function POST(c: Context) {
  const payload = await c.req.json();

  const { type, originUserId, resourceId } =
    acceptInvitationSchema.parse(payload);

  const user = c.get("user");

  if (type === "user") {
    await acceptUserInvitation({
      originUserId,
      targetUserId: user.id,
      bucketId: resourceId,
    });
  } else if (type === "course_maintainer") {
    await acceptCourseMaintainerInvitation({
      originUserId,
      targetUserId: user.id,
      courseId: resourceId,
    });
  } else if (type === "bucket_maintainer") {
    await acceptBucketMaintainerInvitation({
      originUserId,
      targetUserId: user.id,
      bucketId: resourceId,
    });
  } else {
    throw new HTTPException(400, { message: "BAD_REQUEST" });
  }

  return c.json("Invitation accepted");
}
