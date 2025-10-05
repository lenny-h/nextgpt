import * as z from "zod";

export const documentsContentSchema = z
  .object({
    content: z.string().min(1).max(4096),
  })
  .strict();
