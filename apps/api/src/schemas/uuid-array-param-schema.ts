import * as z from "zod";
import { uuidSchema } from "./uuid-schema.js";

export const uuidArrayParamSchema = z
  .string()
  .transform((str) => str.split(",").filter(Boolean))
  .pipe(z.array(uuidSchema))
  .refine((arr) => arr.length > 0, {
    message: "Array must contain at least one UUID",
  })
  .refine((arr) => arr.length <= 20, {
    message: "Array must contain at most 20 UUIDs",
  });
