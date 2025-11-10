"use client";

import { useDiff } from "@/contexts/diff-context";
import { useFilter } from "@/contexts/filter-context";
import { useChatModel } from "@/contexts/selected-chat-model";
import { useIsTemporary } from "@/contexts/temporary-chat-context";
import { useWebTranslations } from "@/contexts/web-translations";
import { processDataPart } from "@/lib/process-data-part";
import { type FrontendFilter } from "@/types/filter";
import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { type MyUIDataTypes } from "@workspace/api-routes/types/custom-ui-data-types";
import { type MyUIMessage } from "@workspace/api-routes/types/custom-ui-message";
import { useEditor } from "@workspace/ui/contexts/editor-context";
import { useRefs } from "@workspace/ui/contexts/refs-context";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { type EditorContent } from "@workspace/ui/editors/text-editor";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { generateUUID } from "@workspace/ui/lib/utils";
import { type DataUIPart, DefaultChatTransport } from "ai";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocalStorage } from "usehooks-ts";
import { ChatHeader } from "./chat-header";
import { Introduction } from "./introduction";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";

export function Chat({
  chatId,
  initialMessages,
}: {
  chatId: string;
  initialMessages: Array<MyUIMessage>;
}) {
  const { webT } = useWebTranslations();
  const { sharedT } = useSharedTranslations();

  const queryClient = useQueryClient();

  const [input, setInput] = useState("");

  const { selectedChatModel, reasoningEnabled } = useChatModel();
  const [isTemporary] = useIsTemporary();
  const { setFilter } = useFilter();

  const { panelRef, textEditorRef, codeEditorRef } = useRefs();
  const [editorMode, setEditorMode] = useEditor();

  const { textDiffPrev, setTextDiffNext, codeDiffPrev, setCodeDiffNext } =
    useDiff();

  const [localTextEditorContent, setLocalTextEditorContent] =
    useLocalStorage<EditorContent>("text-editor-input", {
      id: undefined,
      title: "",
      content: "",
    });
  const [localCodeEditorContent, setLocalCodeEditorContent] =
    useLocalStorage<EditorContent>("text-editor-input", {
      id: undefined,
      title: "",
      content: "",
    });

  // Fetch and set filter from last message metadata if it exists
  useEffect(() => {
    if (initialMessages.length > 0) {
      apiFetcher(
        (client) =>
          client["filter"][":chatId"].$get({
            param: { chatId },
          }),
        sharedT.apiCodes,
      )
        .then((response) => {
          const frontendFilter = response as FrontendFilter;
          if (frontendFilter.bucket.id) {
            setFilter(frontendFilter);
          }
        })
        .catch((error) => {
          console.error("Failed to fetch filter:", error);
        });
    }
  }, [chatId, initialMessages.length]);

  const { sendMessage, messages, setMessages, status, stop, regenerate } =
    useChat<MyUIMessage>({
      id: chatId,
      messages: initialMessages,
      generateId: generateUUID,
      experimental_throttle: 100,
      onData: (dataPart) =>
        processDataPart({
          chatId,
          queryClient,
          dataPart: dataPart as DataUIPart<MyUIDataTypes>,
          panelRef,
          textEditorRef,
          codeEditorRef,
          editorMode,
          setEditorMode,
          localTextEditorContent,
          setLocalTextEditorContent,
          textDiffPrev,
          setTextDiffNext,
          localCodeEditorContent,
          setLocalCodeEditorContent,
          codeDiffPrev,
          setCodeDiffNext,
        }),
      onError: () => toast.error(webT.chat.errorOccurred),
      transport: new DefaultChatTransport({
        api: `${process.env.NEXT_PUBLIC_API_URL}/api/protected/chat`,
        credentials: "include",
        prepareSendMessagesRequest({ messages }) {
          return {
            body: {
              id: chatId,
              message: messages[messages.length - 1],
              modelIdx: selectedChatModel.id,
              isTemp: isTemporary,
              reasoning: selectedChatModel.reasoning && reasoningEnabled,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
          };
        },
      }),
    });

  return (
    <>
      <div className="flex h-dvh flex-col">
        <ChatHeader
          chatId={chatId}
          isEmpty={messages.length === 0}
          isLoading={status === "submitted" || status === "streaming"}
        />

        {messages.length === 0 ? (
          <Introduction />
        ) : (
          <Messages
            chatId={chatId}
            messages={messages}
            setMessages={setMessages}
            status={status}
            regenerate={regenerate}
          />
        )}

        <form className="mx-auto w-full -translate-y-1 sm:px-4 sm:pb-4 md:max-w-3xl md:px-6 md:pb-6">
          <MultimodalInput
            sendMessage={sendMessage}
            chatId={chatId}
            input={input}
            setInput={setInput}
            status={status}
            stop={stop}
          />
        </form>
      </div>
    </>
  );
}
