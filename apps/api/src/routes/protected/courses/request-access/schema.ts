import * as z from "zod";
import { uuidSchema } from "../../../../schemas/uuid-schema.js";

export const requestAccessSchema = z
  .object({
    courseId: uuidSchema,
    key: z.string().min(1).max(168),
  })
  .strict();
