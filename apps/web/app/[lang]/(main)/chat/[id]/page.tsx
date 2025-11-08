"use client";

import { Chat } from "@/components/custom/chat";
import { ChatSkeleton } from "@/components/custom/chat-skeleton";
import { useQuery } from "@tanstack/react-query";
import { type MyUIMessage } from "@workspace/api-routes/types/custom-ui-message";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { useUser } from "@workspace/ui/contexts/user-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ChatPage() {
  const { locale, sharedT } = useSharedTranslations();

  const user = useUser();

  const router = useRouter();
  const { id } = useParams();
  const chatId = Array.isArray(id) ? id[0] : id;

  const {
    data: messages,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["messages", id],
    queryFn: () =>
      apiFetcher(
        (client) =>
          client["messages"][":chatId"].$get({
            param: { chatId: chatId! },
          }),
        sharedT.apiCodes,
      ),
    enabled: !!id && !!user && !!chatId,
  });

  useEffect(() => {
      if (!user) {
        router.replace(`/${locale}/sign-in`);
      }
    }, [user, router, locale]);
  
    useEffect(() => {
      if (!chatId) {
        router.replace(`/${locale}`);
      }
    }, [chatId, router, locale]);
  
    useEffect(() => {
      if (!isPending && (isError || !messages)) {
        router.replace(`/${locale}`);
      }
    }, [isPending, isError, messages, router, locale]);
  
    if (isPending || !chatId || !messages) {
      return <ChatSkeleton />;
    }

  return (
    <Chat
      chatId={chatId}
      initialMessages={messages as unknown as MyUIMessage[]}
    />
  );
}
