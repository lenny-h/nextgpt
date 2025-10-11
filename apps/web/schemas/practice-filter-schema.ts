import * as z from "zod";

import { studyModeSchema } from "./study-mode-schema.js";
import { uuidSchema } from "./uuid-schema.js";

export const practiceFilterSchema = z
  .object({
    bucket: z.object({
      id: uuidSchema,
    }),
    courses: z
      .array(
        z.object({
          id: uuidSchema,
        }),
      )
      .max(5, {
        message: "You can only select up to 5 courses",
      }),
    files: z
      .array(
        z.object({
          id: uuidSchema,
          pageRange: z
            .string()
            .regex(/^\d+(-\d+)?(,\d+(-\d+)?)*$/, {
              message:
                "Page range must be a comma-separated list of numbers or ranges (e.g., '1,3-5,7')",
            })
            .optional(),
        }),
      )
      .max(3, {
        message: "You can only select up to 3 files",
      }),
    studyMode: studyModeSchema,
  })
  .strict();

export type PracticeFilter = z.infer<typeof practiceFilterSchema>;
