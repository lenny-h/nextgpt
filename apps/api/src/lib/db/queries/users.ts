import { createServiceClient } from "../../../utils/supabase/service-client.js";

export async function getUserIdByUsername(username: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("public", true)
    .eq("username", username)
    .single();

  if (error) throw error;

  return data.id;
}

export async function getUserIdsByUsernames(usernames: string[]) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("public", true)
    .in("username", usernames);

  if (error) throw error;
  return data;
}
