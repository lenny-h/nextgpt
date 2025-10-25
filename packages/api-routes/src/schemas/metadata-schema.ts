import * as z from "zod";

import { attachmentSchema } from "./attachment-schema.js";
import { filterSchema } from "./filter-schema.js";
import { practiceFilterSchema } from "./practice-filter-schema.js";

export const metadataSchema = z
  .object({
    filter: z.union([filterSchema, practiceFilterSchema]).optional(),
    attachments: z.array(attachmentSchema).max(5).optional(),
    isStartMessage: z.boolean().optional(),
  })
  .nullable();
