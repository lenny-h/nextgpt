import { chatModels } from "@workspace/api-routes/utils/models.js";
import * as z from "zod";

const basePayloadSchema = z.object({
  id: z.uuid({
    message: "Chat ID must be a valid UUID",
  }),
  message: z.any(), // This will be validate with the ai.validateUIMessages function later
  modelIdx: z
    .number()
    .int()
    .min(0)
    .max(chatModels.length - 1),
  isTemp: z.boolean(),
  reasoning: z.boolean().optional(),
  trigger: z.string().max(128).optional(),
  // Client-side location information
  timezone: z.string().optional(), // e.g., "America/New_York"
});

export const chatPayloadSchema = basePayloadSchema.strict();

export const practicePayloadSchema = basePayloadSchema
  .extend({
    messageCount: z.number().int().nonnegative().optional(),
  })
  .strict();
