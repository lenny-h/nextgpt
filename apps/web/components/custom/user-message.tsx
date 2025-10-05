"use client";

import * as m from "motion/react-m";

import { type MyUIMessage } from "@workspace/api-routes/types/custom-ui-message";
import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { type ChatRequestOptions } from "ai";
import equal from "fast-deep-equal";
import { Copy, Pencil } from "lucide-react";
import { LazyMotion } from "motion/react";
import dynamic from "next/dynamic";
import { memo, useState } from "react";
import { toast } from "sonner";
import { useCopyToClipboard } from "usehooks-ts";
import { AttachmentPreview } from "./attachment-preview";
import { MessageEditor } from "./message-editor";

const loadFeatures = () => import("@/lib/features").then((res) => res.default);

const Markdown = dynamic(() =>
  import("./markdown").then((mod) => mod.Markdown),
);

interface UserMessageProps {
  chatId: string;
  message: MyUIMessage;
  setMessages: (
    messages: MyUIMessage[] | ((messages: MyUIMessage[]) => MyUIMessage[]),
  ) => void;
  regenerate: (chatRequestOptions?: ChatRequestOptions) => Promise<void>;
  isPractice?: boolean;
}

function PureUserMessage({
  chatId,
  message,
  setMessages,
  regenerate,
  isPractice = false,
}: UserMessageProps) {
  console.log("Rendering UserMessage");

  const [_, copyToClipboard] = useCopyToClipboard();
  const [mode, setMode] = useState<"view" | "edit">("view");

  // Extract text and file parts from the message
  const textParts = message.parts.filter((part) => part.type === "text");
  const fileParts = message.parts.filter((part) => part.type === "file");
  const textContent = textParts.map((part) => part.text).join("\n");

  return (
    <LazyMotion features={loadFeatures}>
      <m.article
        className="mx-auto w-full max-w-[735px]"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div className="group/message flex flex-col space-y-1">
          {fileParts.length > 0 && (
            <div className="flex flex-row justify-end gap-2">
              {fileParts.map((filePart, index) => (
                <AttachmentPreview
                  key={filePart.filename || index}
                  attachment={{
                    filename: filePart.filename || `file-${index}`,
                    contentType: filePart.mediaType,
                  }}
                />
              ))}
            </div>
          )}
          <div className="flex w-full items-center justify-end space-x-2">
            {mode === "view" ? (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="text-muted-foreground size-6 opacity-0 group-hover/message:opacity-100"
                      onClick={async () => {
                        await copyToClipboard(textContent);
                        toast.success("Copied to clipboard!");
                      }}
                    >
                      <Copy className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy message</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="text-muted-foreground size-6 opacity-0 group-hover/message:opacity-100"
                      onClick={() => {
                        setMode("edit");
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit message</TooltipContent>
                </Tooltip>
                <div className="bg-muted max-w-3/4 w-fit rounded-2xl px-4 py-2">
                  {isPractice ? (
                    <Markdown sources={[]} parseSourceRefs={false}>
                      {textContent}
                    </Markdown>
                  ) : (
                    textContent
                  )}
                </div>
              </>
            ) : (
              <MessageEditor
                chatId={chatId}
                message={message}
                setMessages={setMessages}
                setMode={setMode}
                regenerate={regenerate}
              />
            )}
          </div>
        </div>
      </m.article>
    </LazyMotion>
  );
}

export const UserMessage = memo(PureUserMessage, (prevProps, nextProps) => {
  if (prevProps.chatId !== nextProps.chatId) return false;
  if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
  if (prevProps.isPractice !== nextProps.isPractice) return false;

  return true;
});
