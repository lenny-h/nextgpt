"use client";

import { useCodeEditorContent } from "@/contexts/code-editor-content-context";
import { useEditor } from "@/contexts/editor-context";
import { useFilter } from "@/contexts/filter-context";
import { useRefs } from "@/contexts/refs-context";
import { useChatModel } from "@/contexts/selected-chat-model";
import { useIsTemporary } from "@/contexts/temporary-chat-context";
import { useTextEditorContent } from "@/contexts/text-editor-content-context";
import { processDataPart } from "@/lib/process-data-part";
import {
  getMessageCountAfterLastStart,
  getMessagesAfterLastStart,
  stripFilter,
} from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { type MyUIDataTypes } from "@workspace/api-routes/types/custom-ui-data-types";
import { type MyUIMessage } from "@workspace/api-routes/types/custom-ui-message";
import { Button } from "@workspace/ui/components/button";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { generateUUID } from "@workspace/ui/lib/utils";
import { type DataUIPart, DefaultChatTransport } from "ai";
import { useCallback, useState } from "react";
import { toast } from "sonner";
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
  const { locale } = useSharedTranslations();

  const queryClient = useQueryClient();

  const [input, setInput] = useState("");

  const { panelRef, textEditorRef, codeEditorRef } = useRefs();
  const [editorMode, setEditorMode] = useEditor();

  const {
    textEditorContent,
    setTextEditorContent,
    diffPrev: textDiffPrev,
    diffPrevString,
    setDiffPrevString,
    setDiffNext: setTextDiffNext,
  } = useTextEditorContent();
  const {
    codeEditorContent,
    setCodeEditorContent,
    diffPrev: codeDiffPrev,
    setDiffNext: setCodeDiffNext,
  } = useCodeEditorContent();

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
          textEditorContent,
          setTextEditorContent,
          textDiffPrev,
          diffPrevString,
          setDiffPrevString,
          setTextDiffNext,
          codeEditorContent,
          setCodeEditorContent,
          codeDiffPrev,
          setCodeDiffNext,
        }),
      onError: () => toast.error("An error occurred, please try again!"),
      transport: new DefaultChatTransport({
        api: `${process.env.NEXT_PUBLIC_API_URL}/api/protected/practice`,
        credentials: "include",
        prepareSendMessagesRequest({ id, messages }) {
          return {
            id,
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

  const { filter, studyMode } = useFilter();
  const { selectedChatModel } = useChatModel();
  const [isTemporary] = useIsTemporary();

  const [showTextArea, setShowTextArea] = useState(true);
  const [showPreviousMessages, setShowPreviousMessages] = useState(false);

  const submitForm = useCallback(() => {
    if (!filter.bucket.id) {
      toast.error("Please select a bucket before submitting your question");
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
            New question
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
