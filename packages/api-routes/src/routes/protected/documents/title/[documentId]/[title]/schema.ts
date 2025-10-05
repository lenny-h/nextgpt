import * as z from "zod";

export const documentsTitleSchema = z.string().min(1).max(128);
