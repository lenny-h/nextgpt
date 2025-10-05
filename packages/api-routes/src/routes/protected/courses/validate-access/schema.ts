import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema.js";
import * as z from "zod";

export const validateAccessSchema = z
  .object({
    courseId: uuidSchema,
  })
  .strict();
