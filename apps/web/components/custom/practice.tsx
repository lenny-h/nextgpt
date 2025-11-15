"use client";

import { useDiff } from "@/contexts/diff-context";
import { useFilter } from "@/contexts/filter-context";
import { useChatModel } from "@/contexts/selected-chat-model";
import { useIsTemporary } from "@/contexts/temporary-chat-context";
import { useWebTranslations } from "@/contexts/web-translations";
import { processDataPart } from "@/lib/process-data-part";
import {
  getMessageCountAfterLastStart,
  getMessagesAfterLastStart,
  stripFilter,
} from "@/lib/utils";
import { type FrontendFilter } from "@/types/filter";
import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { type MyUIDataTypes } from "@workspace/api-routes/types/custom-ui-data-types";
import { type MyUIMessage } from "@workspace/api-routes/types/custom-ui-message";
import { Button } from "@workspace/ui/components/button";
import { useEditor } from "@workspace/ui/contexts/editor-context";
import { useRefs } from "@workspace/ui/contexts/refs-context";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { type EditorContent } from "@workspace/ui/editors/text-editor";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { generateUUID } from "@workspace/ui/lib/utils";
import { type DataUIPart, DefaultChatTransport } from "ai";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocalStorage } from "usehooks-ts";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
import { PracticeForm } from "./practice-form";
import { PracticeHeader } from "./practice-header";

export function Practice({
  chatId,
  initialMessages,
}: {
  chatId: string;
  initialMessages: Array<MyUIMessage>;
}) {
  const { locale, sharedT } = useSharedTranslations();
  const { webT } = useWebTranslations();

  const queryClient = useQueryClient();

  const [input, setInput] = useState("");

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
        api: `${process.env.NEXT_PUBLIC_API_URL}/api/protected/practice`,
        credentials: "include",
        prepareSendMessagesRequest({ messages }) {
          return {
            body: {
              id: chatId,
              message: messages[messages.length - 1],
              messageCount: getMessageCountAfterLastStart(messages),
              modelIdx: selectedChatModel.id,
              isTemp: isTemporary,
            },
          };
        },
      }),
    });

  const { filter, studyMode, setFilter } = useFilter();
  const { selectedChatModel } = useChatModel();
  const [isTemporary] = useIsTemporary();

  const [showTextArea, setShowTextArea] = useState(true);
  const [showPreviousMessages, setShowPreviousMessages] = useState(false);

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
  }, [chatId, initialMessages.length, sharedT.apiCodes]);

  const submitForm = useCallback(() => {
    if (!filter.bucket.id) {
      toast.error(webT.validation.selectBucket);
      return;
    }

    window.history.replaceState({}, "", `/${locale}/practice/${chatId}`);

    sendMessage({
      id: generateUUID(),
      role: "user",
      parts: [{ type: "text", text: "START" }],
      metadata: {
        filter: stripFilter(filter, true),
        isStartMessage: true,
      },
    });
  }, [
    sendMessage,
    locale,
    filter,
    chatId,
    selectedChatModel,
    isTemporary,
    studyMode,
  ]);

  return (
    <>
      <div className="flex h-dvh flex-col">
        <PracticeHeader
          isEmpty={messages.length === 0}
          showTextArea={showTextArea}
          setShowTextArea={setShowTextArea}
          showPreviousMessages={showPreviousMessages}
          setShowPreviousMessages={setShowPreviousMessages}
        />

        {messages.length === 0 ? (
          <PracticeForm submitForm={submitForm} />
        ) : (
          <Messages
            chatId={chatId}
            messages={
              showPreviousMessages
                ? messages
                : getMessagesAfterLastStart(messages)
            }
            setMessages={setMessages}
            status={status}
            regenerate={regenerate}
          />
        )}

        {messages.length > 0 && (
          <Button
            disabled={status !== "ready" || filter.files.length === 0}
            className="mx-auto mb-3 md:mb-4"
            onClick={() => {
              submitForm();
            }}
            variant="outline"
          >
            {webT.practice.newQuestion}
          </Button>
        )}

        {messages.length > 0 && showTextArea && (
          <form className="mx-auto w-full -translate-y-1 px-4 pb-4 md:max-w-3xl md:px-6 md:pb-6">
            <MultimodalInput
              sendMessage={sendMessage}
              chatId={chatId}
              input={input}
              setInput={setInput}
              status={status}
              stop={stop}
            />
          </form>
        )}
      </div>
    </>
  );
}
