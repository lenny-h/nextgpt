import { Chat } from "@/components/custom/chat";
import { type Locale } from "@/i18n.config";
import { createClient } from "@/lib/supabase/server";
import { type MyUIMessage } from "@/types/custom-ui-message";
import { redirect } from "next/navigation";

export default async function ChatPage(props: {
  params: Promise<{ lang: Locale; id: string }>;
}) {
  const { lang, id } = await props.params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect(`/${lang}/sign-in`);
  }

  const { data, error } = await supabase.rpc("get_messages", {
    p_chat_id: id,
  });

  if (error) {
    console.error(error);
    return redirect(`/${lang}`);
  }

  if (data.length === 0) {
    return redirect(`/${lang}`);
  }

  return <Chat chatId={id} initialMessages={data as MyUIMessage[]} />;
}
