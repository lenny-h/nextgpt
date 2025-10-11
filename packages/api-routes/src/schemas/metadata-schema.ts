import * as z from "zod";

import { filterSchema } from "./filter-schema.js";
import { practiceFilterSchema } from "./practice-filter-schema.js";

export const metadataSchema = z
  .object({
    filter: z.union([filterSchema, practiceFilterSchema]).optional(),
    attachments: z
      .array(
        z.object({
          url: z.string().max(1024),
        })
      )
      .max(5)
      .optional(),
    isStartMessage: z.boolean().optional(),
  })
  .nullable();
