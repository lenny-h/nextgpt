import * as z from "zod";
import { studyModeSchema } from "./study-mode-schema.js";
import { uuidSchema } from "./uuid-schema.js";

export const practiceFilterSchema = z
  .object({
    bucketId: uuidSchema,
    courses: z.array(uuidSchema).max(5, {
      message: "You can only select up to 5 courses",
    }),
    files: z
      .array(
        z.object({
          id: uuidSchema,
          chapters: z.array(z.number()).max(10, {
            message: "You can only select up to 10 chapters",
          }),
        })
      )
      .max(3, {
        message: "You can only select up to 3 files",
      }),
    studyMode: studyModeSchema,
  })
  .strict();

export type PracticeFilter = z.infer<typeof practiceFilterSchema>;
