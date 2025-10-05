import * as z from "zod";

export const prefixSchema = z.string().min(3).max(128);
