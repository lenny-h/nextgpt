import * as z from "zod";

export const insertPromptSchema = z.object({
  name: z.string().min(1).max(255),
  content: z.string().min(1).max(4096),
});
