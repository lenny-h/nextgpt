import * as z from "zod";

export const chatsIsFavouriteSchema = z
  .object({
    isFavourite: z.boolean(),
  })
  .strict();
