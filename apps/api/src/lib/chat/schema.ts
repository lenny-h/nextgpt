import * as z from "zod";
import { uuidSchema } from "../../schemas/uuid-schema.js";

const basePayloadSchema = z.object({
  id: z.uuid({
    message: "Chat ID must be a valid UUID",
  }),
  messages: z.array(z.any()).min(1, {
    message: "At least one message is required",
  }),
  modelId: z.union([
    z.enum(["chat-model-small", "chat-model-large"]),
    uuidSchema,
  ]),
  temp: z.boolean(),
  trigger: z.string().max(128).optional(),
});

export const chatPayloadSchema = basePayloadSchema
  .extend({
    reasoning: z.boolean(),
  })
  .strict();

export const practicePayloadSchema = basePayloadSchema.strict();
