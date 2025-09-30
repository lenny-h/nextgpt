import { filenameSchema } from "@/src/schemas/filename-schema.js";
import * as z from "zod";

export const getSignedUrlSchema = z
  .object({
    filename: z.string().refine(
      (value) => {
        const validExtensions = [".pdf", ".jpg", ".png"];
        const extension = value.substring(value.lastIndexOf("."));

        if (!validExtensions.includes(extension)) return false;

        const nameWithoutExt = value.slice(0, value.lastIndexOf("."));
        try {
          filenameSchema.parse(nameWithoutExt);
          return true;
        } catch {
          return false;
        }
      },
      {
        message:
          "Filename must end with .pdf, .jpg, or .png and can only contain letters, numbers, underscores, and whitespaces.",
      }
    ),
    fileSize: z
      .number()
      .int()
      .positive()
      .max(10 * 1024 * 1024, {
        message: "File size must be less than 10 MB",
      }),
    fileType: z.enum(["application/pdf", "image/jpeg", "image/png"], {
      message: "File type must be either PDF, JPG, or PNG",
    }),
  })
  .strict();
