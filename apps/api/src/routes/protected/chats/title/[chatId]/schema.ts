import * as z from "zod";

export const chatsTitleSchema = z
  .object({
    title: z.string().min(1).max(128),
  })
  .strict();
