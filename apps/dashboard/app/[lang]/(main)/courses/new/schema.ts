import * as z from "zod";

import { uuidSchema } from "@workspace/ui/types/validations";

export const createCourseFormSchema = z
  .object({
    bucketId: uuidSchema,
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
