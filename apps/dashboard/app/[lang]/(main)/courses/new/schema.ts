import { uuidSchema } from "@workspace/api-routes/schemas/uuid-schema";
import * as z from "zod";

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
