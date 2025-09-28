"use client";

import { useCodeEditorContent } from "@/contexts/code-editor-content-context";
import { useEditor } from "@/contexts/editor-context";
import { useFilter } from "@/contexts/filter-context";
import { useGlobalTranslations } from "@/contexts/global-translations";
import { useRefs } from "@/contexts/refs-context";
import { useChatModel } from "@/contexts/selected-chat-model";
import { useIsTemporary } from "@/contexts/temporary-chat-context";
import { useTextEditorContent } from "@/contexts/text-editor-content-context";
import { processDataPart } from "@/lib/process-data-part";
import { getMessagesAfterLastStart } from "@/lib/utils";
import { type MyUIMessage } from "@/types/custom-ui-message";
import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { generateUUID } from "@workspace/ui/lib/utils";
import { DefaultChatTransport } from "ai";
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
      messages: getMessagesAfterLastStart(initialMessages),
      generateId: generateUUID,
      experimental_throttle: 100,
      onData: (dataPart) =>
        processDataPart({
          chatId,
          queryClient,
          dataPart,
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
        api: `${process.env.NEXT_PUBLIC_API_URL}/capi/protected/practice`,
        credentials: "include",
        prepareSendMessagesRequest: (options) => ({
          ...options,
          messages: getMessagesAfterLastStart(options.messages),
          body: {
            ...options.body,
          },
        }),
      }),
    });

  const { locale } = useGlobalTranslations();

  const { filter: frontendFilter, studyMode } = useFilter();
  const { selectedChatModel } = useChatModel();
  const [isTemporary] = useIsTemporary();

  const [showTextArea, setShowTextArea] = useState(true);
  const [showPreviousMessages, setShowPreviousMessages] = useState(false);

  const submitForm = useCallback(() => {
    if (!frontendFilter.bucketId) {
      toast.error("Please select a bucket before submitting your question");
      return;
    }

    window.history.replaceState({}, "", `/${locale}/practice/${chatId}`);

    sendMessage(
      {
        id: generateUUID(),
        role: "user",
        parts: [{ type: "text", text: "START" }],
        metadata: {
          filter: {
            bucketId: frontendFilter.bucketId,
            courses: frontendFilter.courses.map((c) => c.id),
            files: frontendFilter.files.map((f) => ({
              id: f.id,
              chapters: Array.from(f.chapters || []),
            })),
            studyMode,
          },
          isStartMessage: true,
        },
      },
      {
        body: {
          id: chatId,
          modelId: selectedChatModel.id,
          temp: isTemporary,
        },
      },
    );
  }, [
    sendMessage,
    locale,
    frontendFilter,
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
            disabled={status !== "ready" || frontendFilter.files.length === 0}
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
