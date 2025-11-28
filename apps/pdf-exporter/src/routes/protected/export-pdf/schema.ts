import * as z from "zod";

export const exportPdfSchema = z
  .object({
    title: z.string().min(1).max(128).optional(),
    content: z.string().min(1).max(32768),
  })
  .strict();
