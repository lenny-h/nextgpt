import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import * as z from "zod";

export const bucketMaintainersSchema = z
  .object({
    userIds: z.array(uuidSchema).max(20),
  })
  .strict();
