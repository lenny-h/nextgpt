import * as z from "zod";

import { filterSchema } from "./filter-schema.js";
import { practiceFilterSchema } from "./practice-filter-schema.js";

export const metadataSchema = z
  .object({
    filter: z.union([filterSchema, practiceFilterSchema]).optional(),
    isStartMessage: z.boolean().optional(),
  })
  .nullable();
