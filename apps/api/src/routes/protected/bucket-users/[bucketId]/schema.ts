import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import * as z from "zod";

export const bucketUsersSchema = z
  .object({
    userIds: z.array(uuidSchema).max(100),
  })
  .strict();
