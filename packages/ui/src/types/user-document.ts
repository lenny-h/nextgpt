import { type Database } from "./database.js";

export type UserDocument =
  Database["public"]["Functions"]["ilike_user_documents"]["Returns"][number];
