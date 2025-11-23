import * as z from "zod";

import { attachmentSchema } from "./attachment-schema.js";
import { filterSchema } from "./filter-schema.js";
import { practiceFilterSchema } from "./practice-filter-schema.js";

const usageSchema = z.object({
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  totalTokens: z.number().optional(),
});

export const metadataSchema = z
  .object({
    filter: z.union([filterSchema, practiceFilterSchema]).optional(),
    attachments: z.array(attachmentSchema).max(5).optional(),
    isStartMessage: z.boolean().optional(),
    totalUsage: usageSchema.optional(),
  })
  .nullable();
