import {
  allowedMimeTypes,
  filenameWithExtensionSchema,
} from "@workspace/api-routes/schemas/filename-schema.js";
import * as z from "zod";

export const getSignedUrlBaseSchema = z
  .object({
    filename: filenameWithExtensionSchema,
    fileSize: z
      .number()
      .int()
      .positive()
      .max(30 * 1024 * 1024, {
        message: "File size must be less than 30 MB",
      }),
    fileType: z.enum(allowedMimeTypes, {
      message: "File type is not allowed",
    }),
  })
  .strict();

export const getSignedUrlSchema = getSignedUrlBaseSchema
  .extend({
    processingDate: z.string().optional(),
    // Page number offset (where the first page with number "1" is located)
    pageNumberOffset: z
      .number()
      .int()
      .min(0, { message: "Page number offset must be at least 0" })
      .max(1000, { message: "Page number offset must be at most 1000" })
      .default(0),
    // PDF pipeline options (only applicable for PDF files)
    pdfPipelineOptions: z
      .object({
        do_ocr: z.boolean().optional(),
        do_code_enrichment: z.boolean().optional(),
        do_formula_enrichment: z.boolean().optional(),
        do_picture_description: z.boolean().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
