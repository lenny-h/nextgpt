import * as z from "zod";

export const attachmentSchema = z.object({
  filename: z.string().max(256),
  contentType: z.string().max(256).optional(),
});

export type Attachment = z.infer<typeof attachmentSchema>;
