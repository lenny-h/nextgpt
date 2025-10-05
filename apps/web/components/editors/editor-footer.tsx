"use client";

import { useEditor } from "@/contexts/editor-context";
import { useFilter } from "@/contexts/filter-context";
import { useRefs } from "@/contexts/refs-context";
import { useChatModel } from "@/contexts/selected-chat-model";
import { useIsTemporary } from "@/contexts/temporary-chat-context";
import { getMessagesAfterLastStart } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import { type MyUIMessage } from "@workspace/api-routes/types/custom-ui-message";
import { Button } from "@workspace/ui/components/button";
import { generateUUID } from "@workspace/ui/lib/utils";
import { DefaultChatTransport } from "ai";
import { usePathname } from "next/navigation";
import { memo } from "react";
import { toast } from "sonner";

export const EditorFooter = memo(() => {
  const [editorMode] = useEditor();
  const { textEditorRef, codeEditorRef } = useRefs();

  const { filter, studyMode } = useFilter();
  const { selectedChatModel } = useChatModel();
  const [isTemporary] = useIsTemporary();

  const pathname = usePathname();
  const chatId = pathname.split("/").pop();

  const { sendMessage, messages, status } = useChat<MyUIMessage>({
    id: chatId,
    generateId: generateUUID,
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

  const submitForm = (content: string) => {
    if (!filter.bucketId) {
      toast.error("Please select a bucket before submitting your question");
      return;
    }

    sendMessage(
      {
        id: generateUUID(),
        role: "user",
        parts: [{ type: "text", text: content }],
        metadata: {
          filter: {
            bucketId: filter.bucketId,
            courses: filter.courses.map((c) => c.id),
            files: filter.files.map((f) => ({
              id: f.id,
              chapters: Array.from(f.chapters || []),
            })),
            studyMode,
          },
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

    textEditorRef.current?.focus();
  };

  const handleSubmit = () => {
    if (editorMode === "text" && textEditorRef.current) {
      submitForm(textEditorRef.current.state.doc.textContent);

      const tr = textEditorRef.current.state.tr.delete(
        0,
        textEditorRef.current.state.doc.content.size,
      );
      textEditorRef.current.dispatch(tr);
    } else if (editorMode === "code" && codeEditorRef.current) {
      const content = `\`\`\`python\n${codeEditorRef.current.state.doc.toString()}\`\`\``;

      submitForm(content);

      codeEditorRef.current.dispatch({
        changes: {
          from: 0,
          to: codeEditorRef.current.state.doc.length,
          insert: "",
        },
      });
    }
  };

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="flex justify-center gap-2 border-t p-2">
      {studyMode !== "multipleChoice" && (
        <Button
          disabled={status !== "ready" || filter.files.length === 0}
          onClick={() => {
            submitForm("START");
          }}
          variant="outline"
        >
          New question
        </Button>
      )}
      <Button disabled={status !== "ready"} onClick={handleSubmit}>
        Submit
      </Button>
    </div>
  );
});
