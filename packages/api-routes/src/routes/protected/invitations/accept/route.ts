import {
  acceptBucketMaintainerInvitation,
  acceptCourseMaintainerInvitation,
  acceptUserInvitation,
} from "@workspace/api-routes/lib/db/queries/invitations.js";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { acceptInvitationSchema } from "./schema.js";

const app = new Hono().post(
  "/",
  validator("json", async (value, c) => {
    const parsed = acceptInvitationSchema.safeParse(value);
    if (!parsed.success) {
      return c.text("BAD_REQUEST", 400);
    }
    return parsed.data;
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
