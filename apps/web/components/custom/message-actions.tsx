import { useEditor } from "@/contexts/editor-context";
import { useRefs } from "@/contexts/refs-context";
import { useChatModel } from "@/contexts/selected-chat-model";
import { useIsTemporary } from "@/contexts/temporary-chat-context";
import { useTextEditorContent } from "@/contexts/text-editor-content-context";
import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { cn, resizeEditor } from "@workspace/ui/lib/utils";
import type { ChatRequestOptions } from "ai";
import {
  Copy,
  Pencil,
  RefreshCcw,
  ThumbsDown,
  ThumbsUp,
  Volume2,
  VolumeX,
} from "lucide-react";
import { memo, useCallback, useState } from "react";
import { toast } from "sonner";
import { useCopyToClipboard } from "usehooks-ts";

interface MessageActionsProps {
  chatId: string;
  content: string;
  role: string;
  isLoading: boolean;
  regenerate: (
    chatRequestOptions?: {
      messageId?: string | undefined;
    } & ChatRequestOptions,
  ) => Promise<void>;
  messageId: string;
  previousMessageId: string;
  isPractice?: boolean;
}

export const MessageActions = memo(
  ({
    chatId,
    content,
    role,
    isLoading,
    regenerate,
    messageId,
    previousMessageId,
    isPractice = false,
  }: MessageActionsProps) => {
    const { sharedT } = useSharedTranslations();

    const { selectedChatModel, reasoningEnabled } = useChatModel();
    const [isTemporary] = useIsTemporary();

    const { panelRef } = useRefs();
    const [, setEditorMode] = useEditor();
    const { setTextEditorContent } = useTextEditorContent();

    const [_, copyToClipboard] = useCopyToClipboard();
    const [liked, setLiked] = useState<null | boolean>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const handleReadAloud = useCallback(() => {
      if (isSpeaking) {
        // Stop current speech
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }

      // Clean the content (remove math delimiters, citations)
      const cleanContent = content
        .replace(/\$\$(.*?)\$\$/gs, "$1")
        .replace(/£(\d+(?:,\s?\d+)*)£/g, "");

      const utterance = new SpeechSynthesisUtterance(cleanContent);

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => {
        setIsSpeaking(false);
        toast.error("Failed to read message");
      };

      window.speechSynthesis.speak(utterance);
    }, [content, isSpeaking]);

    if (isLoading) return null;
    if (role === "user") return null;

    return (
      <TooltipProvider delayDuration={0}>
        <div className="flex flex-row items-center space-x-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="size-4"
                variant="ghost"
                onClick={async () => {
                  await copyToClipboard(content);
                  toast.success("Copied to clipboard!");
                }}
              >
                <Copy />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy message</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="size-4"
                variant="ghost"
                onClick={handleReadAloud}
              >
                {isSpeaking ? <VolumeX /> : <Volume2 />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isSpeaking ? "Stop reading" : "Read aloud"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="size-4"
                variant="ghost"
                onClick={async () => {
                  try {
                    await apiFetcher(
                      (client) =>
                        client.messages["delete-trailing"][
                          ":messageId"
                        ].$delete({
                          param: { messageId: previousMessageId },
                        }),
                      sharedT.apiCodes,
                    );

                    await regenerate({
                      messageId,
                    });
                  } catch (error) {
                    console.error("Error during retry:", error);
                    toast.error(
                      "Failed to process retry operation. Please try again.",
                    );
                  }
                }}
              >
                <RefreshCcw />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Retry</TooltipContent>
          </Tooltip>

          <div className="flex flex-row items-center space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="cursor-pointer"
                  onClick={() => setLiked(true)}
                >
                  <ThumbsUp
                    className={cn(
                      "size-4",
                      liked && "fill-current text-green-500",
                    )}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent>Like</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="cursor-pointer"
                  onClick={() => setLiked(false)}
                >
                  <ThumbsDown
                    className={cn(
                      "size-4",
                      liked === false && "text-destructive fill-current",
                    )}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent>Dislike</TooltipContent>
            </Tooltip>
          </div>

          <button
            className="flex cursor-pointer space-x-1"
            onClick={() => {
              console.log(content);

              setTextEditorContent({
                title: "",
                content: content
                  .replace(/\$\$(.*?)\$\$/gs, "$$$1$$")
                  .replace(/£(\d+(?:,\s?\d+)*)£/g, ""),
              });
              setEditorMode("text");
              resizeEditor(panelRef, false);
            }}
          >
            <Pencil className="size-4" />
            <span className="text-muted-foreground text-xs">Editor</span>
          </button>
        </div>
      </TooltipProvider>
    );
  },
);
