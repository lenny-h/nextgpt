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
import { memo, useState } from "react";
import { toast } from "sonner";
import { useCopyToClipboard } from "usehooks-ts";
import { AttachmentPreview } from "./attachment-preview";
import { MessageEditor } from "./message-editor";

const loadFeatures = () => import("@/lib/features").then((res) => res.default);

interface UserMessageProps {
  chatId: string;
  message: MyUIMessage;
  setMessages: (
    messages: MyUIMessage[] | ((messages: MyUIMessage[]) => MyUIMessage[]),
  ) => void;
  regenerate: (
    chatRequestOptions?: {
      messageId?: string | undefined;
    } & ChatRequestOptions,
  ) => Promise<void>;
  isPractice?: boolean;
}

function PureUserMessage({
  chatId,
  message,
  setMessages,
  regenerate,
}: UserMessageProps) {
  console.log("Rendering UserMessage");

  const [_, copyToClipboard] = useCopyToClipboard();
  const [mode, setMode] = useState<"view" | "edit">("view");

  // Extract text and file parts from the message
  const textParts = message.parts.filter((part) => part.type === "text");
  const textContent = textParts.map((part) => part.text).join("\n");

  const attachments = message.metadata?.attachments;

  return (
    <LazyMotion features={loadFeatures}>
      <m.article
        className="mx-auto w-full max-w-[735px]"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div className="group/message flex flex-col space-y-1">
          {attachments && attachments.length > 0 && (
            <div className="flex flex-row justify-end gap-2">
              {attachments.map((attachment, index) => {
                const filename = attachment.url.split("/").pop() ?? "";
                return (
                  <AttachmentPreview
                    key={index}
                    attachment={{
                      filename,
                      contentType: filename.split(".").pop() || "",
                    }}
                  />
                );
              })}
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
                <div className="bg-muted max-w-3/4 w-fit whitespace-pre-wrap rounded-2xl px-4 py-2">
                  {textContent}
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
