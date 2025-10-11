import * as z from "zod";
import { uuidSchema } from "./uuid-schema.js";

export const filterSchema = z
  .object({
    bucket: z.object({
      id: uuidSchema,
    }),
    courses: z
      .array(
        z.object({
          id: uuidSchema,
        })
      )
      .max(5, {
        message: "You can only select up to 5 courses",
      }),
    files: z
      .array(
        z.object({
          id: uuidSchema,
        })
      )
      .max(5, {
        message: "You can only select up to 5 files",
      }),
    documents: z
      .array(
        z.object({
          id: uuidSchema,
        })
      )
      .max(1, {
        message: "You can only select up to 1 document",
      }),
  })
  .strict();

export type Filter = z.infer<typeof filterSchema>;
