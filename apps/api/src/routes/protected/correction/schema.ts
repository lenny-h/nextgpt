import * as z from "zod";

export const correctionSchema = z
  .object({
    solutionFilename: z
      .string()
      .min(1, { message: "Solution filename is required" }),
    handInFilenames: z
      .array(z.string())
      .min(1, { message: "At least one hand-in filename is required" })
      .max(25, {
        message: "Maximum of 25 hand-in filenames allowed",
      }),
    promptId: z.uuid().optional(),
  })
  .strict();
