import * as z from "zod";
import { uuidSchema } from "../../../../schemas/uuid-schema.js";

export const rejectInvitationSchema = z.object({
  type: z.enum(["user", "course_maintainer", "bucket_maintainer"]),
  originUserId: uuidSchema,
  resourceId: uuidSchema,
});
