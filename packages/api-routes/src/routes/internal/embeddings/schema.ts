import * as z from "zod";

export const singleEmbeddingSchema = z
  .object({
    text: z
      .string()
      .min(1, { message: "Text cannot be empty" })
      .max(8192, { message: "Text must be less than 8192 characters" }),
  })
  .strict();

export const batchEmbeddingSchema = z
  .object({
    texts: z
      .array(
        z
          .string()
          .min(1, { message: "Each text cannot be empty" })
          .max(8192, { message: "Each text must be less than 8192 characters" })
      )
      .min(1, { message: "At least one text is required" })
      .max(100, { message: "Maximum 100 texts per batch" }),
  })
  .strict();

export type SingleEmbeddingInput = z.infer<typeof singleEmbeddingSchema>;
export type BatchEmbeddingInput = z.infer<typeof batchEmbeddingSchema>;
