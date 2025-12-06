import { useWebTranslations } from "@/contexts/web-translations";
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
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { resizeEditor } from "@workspace/ui/lib/utils";
import type { ChatRequestOptions } from "ai";
import {
  Copy,
  GitFork,
  Pencil,
  RefreshCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useRouter } from "next/navigation";
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
  }: MessageActionsProps) => {
    const { locale, sharedT } = useSharedTranslations();
    const { webT } = useWebTranslations();

    const router = useRouter();
    const { panelRef, textEditorRef } = useRefs();
    const [, setEditorMode] = useEditor();

    const [, copyToClipboard] = useCopyToClipboard();

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

    const handleFork = useCallback(async () => {
      toast.promise(
        apiFetcher(
          (client) =>
            client["chats"]["fork"][":chatId"].$post({
              param: { chatId },
              json: { messageId },
            }),
          sharedT.apiCodes,
        ),
        {
          loading: webT.navHistory.forkingChat,
          success: (data) => {
            router.push(`/${locale}/chat/${data.id}`);
            return webT.navHistory.chatForked;
          },
          error: webT.navHistory.failedToForkChat,
        },
      );
    }, [chatId, messageId, sharedT, webT, router, locale]);

    if (isLoading) return null;
    if (role === "user") return null;

    return (
      <TooltipProvider delayDuration={0}>
        <div className="border-muted flex flex-row items-center space-x-4 rounded-lg border p-2">
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
              {isSpeaking
                ? webT.messageActions.stopReading
                : webT.messageActions.readAloud}
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

          <Tooltip>
            <TooltipTrigger asChild>
              <Button className="size-4" variant="ghost" onClick={handleFork}>
                <GitFork />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{webT.navHistory.forkFromHere}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="size-4"
                variant="ghost"
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
                <Pencil />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{webT.messageActions.editor}</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  },
);
