import * as z from "zod";

export const saveDocumentSchema = z
  .object({
    content: z.string().min(1).max(4096),
  })
  .strict();
