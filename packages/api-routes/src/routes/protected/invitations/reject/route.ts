import {
  deleteBucketMaintainerInvitation,
  deleteCourseMaintainerInvitation,
  deleteUserInvitation,
} from "@workspace/api-routes/lib/db/queries/invitations.js";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { rejectInvitationSchema } from "./schema.js";

const app = new Hono().post(
  "/",
  validator("json", async (value, c) => {
    const parsed = rejectInvitationSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, { message: "BAD_REQUEST" });
    }
    return parsed.data;
  }),
  async (c) => {
    const { type, originUserId, resourceId } = c.req.valid("json");
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
);

export default app;
