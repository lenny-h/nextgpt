import * as z from "zod";

export const createProfileSchema = z
  .object({
    name: z
      .string()
      .min(3, {
        message: "Name is required and must be at least 3 characters long.",
      })
      .max(128, {
        message: "Name must be less than 32 characters.",
      }),
    username: z
      .string()
      .min(3, {
        message: "Username is required and must be at least 3 characters long.",
      })
      .max(32, {
        message: "Username must be less than 32 characters.",
      })
      .regex(/^[a-zA-Z0-9_]+$/, {
        message: "Username can only contain letters, numbers, and underscores.",
      }),
    public: z.boolean(),
  })
  .strict();

export type CreateProfileData = z.infer<typeof createProfileSchema>;
