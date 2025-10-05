import * as z from "zod";

export const filenameSchema = z
  .string()
  .min(3, {
    message: "Filename is required and must be at least 3 characters long.",
  })
  .max(64, {
    message: "Filename must be less than 64 characters.",
  })
  .regex(/^[a-zA-Z0-9_\s]+$/, {
    message:
      "Filename can only contain letters, numbers, underscores, and whitespaces.",
  });
