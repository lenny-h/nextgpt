import { uuidSchema } from "@/src/schemas/uuid-schema.js";
import * as z from "zod";

export const requestAccessSchema = z
  .object({
    courseId: uuidSchema,
    key: z.string().min(1).max(168),
  })
  .strict();
