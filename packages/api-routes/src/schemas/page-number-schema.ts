import * as z from "zod";

export const pageNumberSchema = z.preprocess(
  (val) => (val ? Number(val) : 0),
  z.number().int().min(0).max(200)
);
