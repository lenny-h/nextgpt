import { type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import {
  deleteUserInvitation,
  deleteCourseMaintainerInvitation,
  deleteBucketMaintainerInvitation,
} from "../../../../lib/db/queries/invitations.js";
import { rejectInvitationSchema } from "./schema.js";

// Important: This route is not really necessary, as we can use the supabase client to delete the invitation directly.

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
    throw new HTTPException(400, { message: "Invalid invitation type" });
  }

  return c.text("Invitation rejected");
}
