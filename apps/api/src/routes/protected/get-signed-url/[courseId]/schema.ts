import * as z from "zod";
import { filenameSchema } from "../../../../schemas/filename-schema.js";

export const getSignedUrlSchema = z
  .object({
    filename: z.string().refine(
      (value) => {
        if (!value.endsWith(".pdf")) return false;
        const nameWithoutExt = value.slice(0, -4);
        try {
          filenameSchema.parse(nameWithoutExt);
          return true;
        } catch {
          return false;
        }
      },
      {
        message:
          "Filename must end with .pdf and must exclude special characters",
      }
    ),
    fileSize: z
      .number()
      .int()
      .positive()
      .max(20 * 1024 * 1024, {
        message: "File size must be less than 20 MB",
      }),
    fileType: z.enum(["application/pdf"]),
    processingDate: z.string().optional(),
  })
  .strict();
