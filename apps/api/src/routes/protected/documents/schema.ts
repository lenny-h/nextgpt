import * as z from "zod";

export const insertDocumentSchema = z
  .object({
    title: z.string().min(1).max(128),
    content: z.string().min(1).max(4096),
    kind: z.enum(["text", "code"]),
  })
  .strict();
