import * as z from "zod";

export const documentsTitleSchema = z
  .object({
    title: z.string().min(1).max(128),
  })
  .strict();
