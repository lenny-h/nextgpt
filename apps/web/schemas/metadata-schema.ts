import * as z from "zod";

import { filterSchema } from "./filter-schema.js";
import { practiceFilterSchema } from "./practice-filter-schema.js";

export const metadataSchema = z
  .object({
    filter: z.union([filterSchema, practiceFilterSchema]).optional(),
    attachments: z
      .array(
        z.object({
          filename: z.string().max(256),
          contentType: z.string().max(256).optional(),
        }),
      )
      .max(5)
      .optional(),
    isStartMessage: z.boolean().optional(),
  })
  .nullable();
