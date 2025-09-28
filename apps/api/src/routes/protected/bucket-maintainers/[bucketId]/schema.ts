import * as z from "zod";
import { uuidSchema } from "../../../../schemas/uuid-schema.js";

export const bucketMaintainersSchema = z
  .object({
    userIds: z.array(uuidSchema).max(20),
  })
  .strict();
