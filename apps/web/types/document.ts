import { type Database } from "@workspace/ui/types/database";

export type Document =
  Database["public"]["Functions"]["ilike_user_documents"]["Returns"][number];
