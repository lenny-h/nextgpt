import * as z from "zod";

export const patchPromptSchema = z.object({
  content: z.string().min(1).max(4096),
});
