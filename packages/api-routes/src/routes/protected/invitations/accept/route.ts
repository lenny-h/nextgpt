import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import {
  acceptBucketMaintainerInvitation,
  acceptCourseMaintainerInvitation,
  acceptUserInvitation,
} from "@workspace/api-routes/lib/db/queries/invitations.js";
import { acceptInvitationSchema } from "./schema.js";

const app = new Hono().post(
  "/",
  validator("json", async (value) => {
    return acceptInvitationSchema.parse(value);
  }),
  async (c) => {
    const { type, originUserId, resourceId } = c.req.valid("json");
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

    return c.json({ message: "Invitation accepted" });
  }
);

export default app;
