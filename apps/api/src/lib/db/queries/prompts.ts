import { createServiceClient } from "../../../utils/supabase/service-client.js";

export async function getPrompt(promptId: string) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("prompts")
    .select("content")
    .eq("id", promptId)
    .single();

  if (error) throw error;

  return data.content;
}

export async function insertPrompt({
  userId,
  name,
  content,
}: {
  userId: string;
  name: string;
  content: string;
}) {
  const supabase = createServiceClient();

  const { error } = await supabase.from("prompts").insert({
    user_id: userId,
    name,
    content,
  });

  if (error) throw error;
}

export async function getPromptsCount(userId: string) {
  const supabase = createServiceClient();

  const { count, error } = await supabase
    .from("prompts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw error;
  return count;
}
