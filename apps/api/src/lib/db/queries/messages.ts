import { type MyUIMessage } from "../../../types/custom-ui-message.js";
import { createServiceClient } from "../../../utils/supabase/service-client.js";

export async function getMessageById({
  userId,
  messageId,
}: {
  userId: string;
  messageId: string;
}) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("messages")
    .select()
    .eq("id", messageId)
    .eq("user_id", userId);

  if (error) throw error;
  return data;
}

export async function getMessagesByChatId({ chatId }: { chatId: string }) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("messages")
    .select()
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function saveMessages({
  chatId,
  newMessages,
}: {
  chatId: string;
  newMessages: MyUIMessage[];
}) {
  const supabase = createServiceClient();

  const { data, error } = await supabase.from("messages").upsert(
    // @ts-ignore
    newMessages.map((msg) => ({
      chat_id: chatId,
      ...msg,
    }))
  );

  if (error) throw error;
  return data;
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: string;
}) {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("chat_id", chatId)
    .gte("created_at", timestamp);

  if (error) throw error;
}

export async function isChatOwner({
  userId,
  chatId,
}: {
  userId: string;
  chatId: string;
}) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("chats")
    .select("user_id")
    .eq("id", chatId)
    .single();

  if (error) throw error;

  return data.user_id === userId;
}

export async function deleteLastMessage({ chatId }: { chatId: string }) {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("chat_id", chatId)
    .order("created_at", { ascending: false });

  if (error) throw error;
}
