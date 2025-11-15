import * as z from "zod";

const createBucketFormSchema = z
  .object({
    bucketName: z
      .string()
      .min(3, {
        message: "Bucket name is required.",
      })
      .max(128, {
        message: "Bucket name must be less than 128 characters.",
      }),
    public: z.boolean(),
  })
  .strict();

export const createBucketPayloadSchema = z
  .object({
    values: createBucketFormSchema,
    type: z.enum(["small", "medium", "large"]),
  })
  .strict();

export type CreateBucketPayload = z.infer<typeof createBucketPayloadSchema>;
