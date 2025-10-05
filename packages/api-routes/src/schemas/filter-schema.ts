import * as z from "zod";

export const filterSchema = z
  .object({
    bucketId: z.uuid({
      message: "Bucket ID must be a valid UUID",
    }),
    courses: z
      .array(
        z.uuid({
          version: "v4",
          message: "Course Ids must be valid UUIDs",
        })
      )
      .max(5, {
        message: "You can only select up to 5 courses",
      }),
    files: z
      .array(
        z.uuid({
          version: "v4",
          message: "File Ids must be valid UUIDs",
        })
      )
      .max(5, {
        message: "You can only select up to 5 files",
      }),
    documents: z
      .array(
        z.uuid({
          version: "v4",
          message: "Document Ids must be valid UUIDs",
        })
      )
      .max(1, {
        message: "You can only select up to 1 document",
      }),
  })
  .strict();

export type Filter = z.infer<typeof filterSchema>;
