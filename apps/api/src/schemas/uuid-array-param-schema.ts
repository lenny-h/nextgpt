import * as z from "zod";
import { uuidSchema } from "./uuid-schema.js";

export const createUuidArrayParamSchema = (maxItems: number) =>
  z
    .string()
    .transform((str) => str.split(",").filter(Boolean))
    .pipe(z.array(uuidSchema))
    .refine((arr) => arr.length > 0, {
      message: "Array must contain at least one UUID",
    })
    .refine((arr) => arr.length <= maxItems, {
      message: `Array must contain at most ${maxItems} UUIDs`,
    });
