import * as z from "zod";

const createCourseFormSchema = z
  .object({
    bucketId: z.uuid({
      version: "v4",
      message: "Bucket ID must be a valid UUID",
    }),
    courseName: z
      .string()
      .min(3, {
        message: "Course name is required.",
      })
      .max(128, {
        message: "Course name must be less than 128 characters.",
      }),
    courseDescription: z.string().max(512, {
      message: "Course description must be less than 512 characters.",
    }),
    password: z.string().optional(),
  })
  .strict();

export const createCourseSchema = z
  .object({
    values: createCourseFormSchema,
  })
  .strict();
