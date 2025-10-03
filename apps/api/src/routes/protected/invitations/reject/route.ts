import {
  deleteBucketMaintainerInvitation,
  deleteCourseMaintainerInvitation,
  deleteUserInvitation,
} from "@/src/lib/db/queries/invitations.js";
import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { rejectInvitationSchema } from "./schema.js";

export async function POST(c: Context) {
  const payload = await c.req.json();

  const { type, originUserId, resourceId } =
    rejectInvitationSchema.parse(payload);

  const user = c.get("user");

  if (type === "user") {
    await deleteUserInvitation({
      originUserId,
      targetUserId: user.id,
      bucketId: resourceId,
    });
  } else if (type === "course_maintainer") {
    await deleteCourseMaintainerInvitation({
      originUserId,
      targetUserId: user.id,
      courseId: resourceId,
    });
  } else if (type === "bucket_maintainer") {
    await deleteBucketMaintainerInvitation({
      originUserId,
      targetUserId: user.id,
      bucketId: resourceId,
    });
  } else {
    throw new HTTPException(400, { message: "BAD_REQUEST" });
  }

  return c.json({ message: "Invitation rejected" });
}
