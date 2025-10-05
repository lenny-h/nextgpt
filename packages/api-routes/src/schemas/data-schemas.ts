import * as z from "zod";
import { artifactKindSchema } from "../types/artifact-kind.js";
import { uuidSchema } from "./uuid-schema.js";

export const dataSchemas = {
  chat: z
    .object({
      id: uuidSchema,
    })
    .strict(),
  kind: z
    .object({
      id: uuidSchema,
      title: z.string().min(1).max(128),
      kind: artifactKindSchema,
    })
    .strict(),
  "text-delta": z.string(),
  "code-delta": z.string(),
};
