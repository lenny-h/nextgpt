import {
  allowedMimeTypes,
  filenameWithExtensionSchema,
} from "@workspace/api-routes/schemas/filename-schema.js";
import * as z from "zod";

export const getSignedUrlSchema = z
  .object({
    filename: filenameWithExtensionSchema,
    fileSize: z
      .number()
      .int()
      .positive()
      .max(10 * 1024 * 1024, {
        message: "File size must be less than 10 MB",
      }),
    fileType: z.string().refine((value) => allowedMimeTypes.includes(value), {
      message: `Unsupported file type. Supported MIME types: ${allowedMimeTypes.join(
        ", "
      )}`,
    }),
  })
  .strict();
