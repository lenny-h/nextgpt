import * as z from "zod";
import { uuidSchema } from "../../../../schemas/uuid-schema.js";

export const validateAccessSchema = z
  .object({
    courseId: uuidSchema,
  })
  .strict();
