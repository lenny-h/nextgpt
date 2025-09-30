import { filterSchema } from "@/src/schemas/filter-schema.js";
import * as z from "zod";

export const querySchema = z
  .string()
  .min(3, {
    message: "Query must be at least 3 characters long",
  })
  .max(256, {
    message: "Query must be at most 256 characters long",
  });

export const searchPayloadSchema = z.object({
  filter: filterSchema,
  fts: z.boolean(),
});
