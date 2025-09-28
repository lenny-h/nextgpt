import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { type Database } from "../../types/database.js";

let supabase: SupabaseClient<Database> | null = null;

export const createServiceClient = () => {
  if (supabase) {
    return supabase;
  }

  supabase = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  return supabase;
};
