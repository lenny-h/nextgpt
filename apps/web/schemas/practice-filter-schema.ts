import * as z from "zod";

import { studyModeSchema } from "./study-mode-schema.js";

export const practiceFilterSchema = z
  .object({
    bucketId: z.uuid({
      version: "v4",
      message: "Bucket ID must be a valid UUID",
    }),
    courses: z
      .array(
        z.uuid({
          version: "v4",
          message: "Course Ids must be valid UUIDs",
        })
      )
      .max(5, {
        message: "You can only select up to 5 courses",
      }),
    files: z
      .array(
        z.object({
          id: z.uuid({
            version: "v4",
            message: "File Ids must be valid UUIDs",
          }),
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
