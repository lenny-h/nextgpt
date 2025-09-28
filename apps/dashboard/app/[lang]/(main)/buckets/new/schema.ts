import * as z from "zod";

export const createBucketFormSchema = z
  .object({
    bucketName: z
      .string()
      .min(3, {
        message: "Bucket name is required.",
      })
      .max(128, {
        message: "Bucket name must be less than 128 characters.",
      }),
  })
  .strict();

export type CreateBucketFormData = z.infer<typeof createBucketFormSchema>;
