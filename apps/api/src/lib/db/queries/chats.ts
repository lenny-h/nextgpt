import { createServiceClient } from "../../../utils/supabase/service-client.js";

export async function getChatById({ id }: { id: string }) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("chats")
    .select()
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function getFavouriteChatsByUserId({
  id,
  cursor,
}: {
  id: string;
  cursor: string | null;
}) {
  const supabase = createServiceClient();

  let query = supabase
    .from("chats")
    .select()
    .eq("user_id", id)
    .eq("is_favourite", true)
    .order("created_at", { ascending: false })
    .limit(10);

  if (cursor) {
    query = query.lt("created_at", new Date(cursor).toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function updateChatFavouriteStatus({
  id,
  isFavourite,
}: {
  id: string;
  isFavourite: boolean;
}) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("chats")
    .update({ is_favourite: isFavourite })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error("Not found");
  return data;
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("chats")
    .insert({
      id,
      user_id: userId,
      title,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    ...data,
    created_at: new Date(data.created_at).toLocaleString(),
  };
}

export async function deleteChatById({ id }: { id: string }) {
  const supabase = createServiceClient();

  const { error } = await supabase.from("chats").delete().eq("id", id);

  if (error) throw error;
}
