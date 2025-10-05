import * as z from "zod";

export const completionSchema = z
  .object({
    context: z
      .string()
      .min(10, {
        message: "The context may not be empty",
      })
      .max(1024, { message: "The context must be less than 1024 characters" }),
  })
  .strict();
