import * as z from "zod";

export const feedbackSchema = z.object({
  subject: z
    .string()
    .min(3, {
      message: "Subject is required and must be at least 3 characters long",
    })
    .max(64, {
      message: "Subject must be at most 64 characters long",
    }),
  content: z
    .string()
    .min(20, {
      message: "Content is required and must be at least 20 characters long",
    })
    .max(512, {
      message: "Content must be at most 512 characters long",
    }),
});
