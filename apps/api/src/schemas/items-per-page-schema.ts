import * as z from "zod";

export const itemsPerPageSchema = z.number().int().min(5).max(10).default(10);
