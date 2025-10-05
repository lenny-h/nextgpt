"use client";

import { useCodeEditorContent } from "@/contexts/code-editor-content-context";
import { useEditor } from "@/contexts/editor-context";
import { useRefs } from "@/contexts/refs-context";
import { useTextEditorContent } from "@/contexts/text-editor-content-context";
import { useWebTranslations } from "@/contexts/web-translations";
import { processDataPart } from "@/lib/process-data-part";
import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { type MyUIDataTypes } from "@workspace/api-routes/types/custom-ui-data-types";
import { type MyUIMessage } from "@workspace/api-routes/types/custom-ui-message";
import { generateUUID } from "@workspace/ui/lib/utils";
import { type DataUIPart, DefaultChatTransport } from "ai";
import { useState } from "react";
import { toast } from "sonner";
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
      onError: () => toast.error(webT.chat.errorOccurred),
      transport: new DefaultChatTransport({
        api: `${process.env.NEXT_PUBLIC_API_URL}/capi/protected/chat`,
        credentials: "include",
      }),
    });

  return (
    <>
      <div className="flex h-dvh flex-col">
        <ChatHeader chatId={chatId} isEmpty={messages.length === 0} />

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
