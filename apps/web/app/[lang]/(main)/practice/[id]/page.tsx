"use client";

import { ChatSkeleton } from "@/components/custom/chat-skeleton";
import { Practice } from "@/components/custom/practice";
import { useQuery } from "@tanstack/react-query";
import { type MyUIMessage } from "@workspace/api-routes/types/custom-ui-message";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { useUser } from "@workspace/ui/contexts/user-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { redirect, useParams, useRouter } from "next/navigation";

export default function PracticePage() {
  const { locale, sharedT } = useSharedTranslations();

  const user = useUser();

  const router = useRouter();
  const { id } = useParams();
  const chatId = Array.isArray(id) ? id[0] : id;

  if (!user) {
    return router.push(`/${locale}/sign-in`);
  }

  if (!chatId) {
    return redirect(`/${locale}`);
  }

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
            param: { chatId },
          }),
        sharedT.apiCodes,
      ),
    enabled: !!id,
  });

  if (isPending) {
    return <ChatSkeleton />;
  }

  if (isError || !messages) {
    router.push(`/${locale}`);
  }

  return (
    <Practice
      chatId={chatId}
      initialMessages={messages as unknown as MyUIMessage[]}
    />
  );
}
