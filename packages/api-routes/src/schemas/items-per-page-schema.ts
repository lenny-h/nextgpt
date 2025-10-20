import * as z from "zod";

export const itemsPerPageSchema = z.preprocess(
  (val) => (val ? Number(val) : 0),
  z.number().int().min(5).max(10)
);
