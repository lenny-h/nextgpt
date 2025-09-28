import * as z from "zod";
import { uuidSchema } from "../../../../schemas/uuid-schema.js";

export const bucketUsersSchema = z
  .object({
    userIds: z.array(uuidSchema).max(100),
  })
  .strict();
