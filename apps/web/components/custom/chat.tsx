"use client";

import { useCodeEditorContent } from "@/contexts/code-editor-content-context";
import { useEditor } from "@/contexts/editor-context";
import { useRefs } from "@/contexts/refs-context";
import { useTextEditorContent } from "@/contexts/text-editor-content-context";
import { processDataPart } from "@/lib/process-data-part";
import { type MyUIMessage } from "@/types/custom-ui-message";
import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { generateUUID } from "@workspace/ui/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { ChatHeader } from "./chat-header";
import { Introduction } from "./introduction";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
import { DefaultChatTransport } from "ai";
import { useGlobalTranslations } from "@/contexts/global-translations";

export function Chat({
  chatId,
  initialMessages,
}: {
  chatId: string;
  initialMessages: Array<MyUIMessage>;
}) {
  const queryClient = useQueryClient();
  const { globalT } = useGlobalTranslations();

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
      onError: () => toast.error(globalT.components.chat.errorOccurred),
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
