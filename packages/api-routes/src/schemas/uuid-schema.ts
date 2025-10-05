import * as z from "zod";

export const uuidSchema = z.uuid({
  version: "v4",
  message: "Invalid UUID",
});
