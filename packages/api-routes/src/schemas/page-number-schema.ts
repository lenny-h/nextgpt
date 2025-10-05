import * as z from "zod";

export const pageNumberSchema = z.number().int().min(0).max(200).default(0);
