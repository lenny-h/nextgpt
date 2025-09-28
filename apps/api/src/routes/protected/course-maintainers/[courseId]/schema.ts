import * as z from "zod";
import { uuidSchema } from "../../../../schemas/uuid-schema.js";

export const courseMaintainersSchema = z
  .object({
    userIds: z.array(uuidSchema).max(20),
  })
  .strict();
