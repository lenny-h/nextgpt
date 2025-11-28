import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { useEditor } from "@workspace/ui/contexts/editor-context";
import { useRefs } from "@workspace/ui/contexts/refs-context";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { useWebTranslations } from "@/contexts/web-translations";
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
}

export const MessageActions = memo(
  ({
    content,
    role,
    isLoading,
    regenerate,
    messageId,
    previousMessageId,
  }: MessageActionsProps) => {
    const { sharedT } = useSharedTranslations();
    const { webT } = useWebTranslations();

    const { panelRef, textEditorRef } = useRefs();
    const [, setEditorMode] = useEditor();

    const [, copyToClipboard] = useCopyToClipboard();
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
        .replace(/\$(.*?)\$/g, "$1")
        .replace(/\$\$(.*?)\$\$/gs, "$1")
        .replace(/\[\[(doc|web):[^\]]+\]\]/g, "");

      const utterance = new SpeechSynthesisUtterance(cleanContent);

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (e) => {
        setIsSpeaking(false);
        
        console.error("SpeechSynthesis error:", e);
        if (e.error === "interrupted" || e.error === "canceled") return;

        toast.error(webT.messageActions.failedRead);
      };

      window.speechSynthesis.speak(utterance);
    }, [content, isSpeaking, webT]);

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
                  toast.success(webT.messageActions.copiedToClipboard);
                }}
              >
                <Copy />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{webT.messageActions.copy}</TooltipContent>
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
              {isSpeaking ? webT.messageActions.stopReading : webT.messageActions.readAloud}
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
                    toast.error(webT.messageActions.retryFailed);
                  }
                }}
              >
                <RefreshCcw />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{webT.messageActions.retry}</TooltipContent>
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
              <TooltipContent>{webT.messageActions.like}</TooltipContent>
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
              <TooltipContent>{webT.messageActions.dislike}</TooltipContent>
            </Tooltip>
          </div>

          <button
            className="flex cursor-pointer space-x-1"
            onClick={async () => {
              console.log(content);

              setEditorMode("text");
              resizeEditor(panelRef, false);

              const { updateTextEditorWithDispatch } = await import(
                "@workspace/ui/editors/text-editor"
              );
              updateTextEditorWithDispatch(textEditorRef, content);
            }}
          >
            <Pencil className="size-4" />
            <span className="text-muted-foreground text-sm">{webT.messageActions.editor}</span>
          </button>
        </div>
      </TooltipProvider>
    );
  },
);
