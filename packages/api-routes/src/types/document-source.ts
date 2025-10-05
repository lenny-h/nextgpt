import * as z from "zod";
import { uuidSchema } from "../schemas/uuid-schema.js";

export const documentSourceSchema = z.object({
  id: z.string(),
  fileId: uuidSchema,
  fileName: z.string().min(1).max(128),
  courseId: uuidSchema,
  courseName: z.string().min(1).max(128),
  pageIndex: z.number().min(0),
  pageContent: z.string().min(1).max(2048).optional(),
});

export type DocumentSource = z.infer<typeof documentSourceSchema>;
