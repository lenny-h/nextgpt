import { useGlobalTranslations } from "@/contexts/global-translations";
import { useChatModel } from "@/contexts/selected-chat-model";
import { useIsTemporary } from "@/contexts/temporary-chat-context";
import { type MyUIMessage } from "@/types/custom-ui-message";
import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { checkResponse } from "@workspace/ui/lib/translation-utils";
import { ChatRequestOptions } from "ai";
import equal from "fast-deep-equal";
import { X } from "lucide-react";
import { Dispatch, memo, SetStateAction, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { toast } from "sonner";
import { SendButton } from "./send-button";

export type MessageEditorProps = {
  chatId: string;
  message: MyUIMessage;
  setMessages: (
    messages: MyUIMessage[] | ((messages: MyUIMessage[]) => MyUIMessage[]),
  ) => void;
  setMode: Dispatch<SetStateAction<"view" | "edit">>;
  regenerate: (chatRequestOptions?: ChatRequestOptions) => Promise<void>;
};

const PureMessageEditor = ({
  chatId,
  message,
  setMode,
  setMessages,
  regenerate,
}: MessageEditorProps) => {
  const { globalT } = useGlobalTranslations();

  const { selectedChatModel } = useChatModel();
  const [isTemporary] = useIsTemporary();

  const textParts = message.parts.filter((part) => part.type === "text");
  const fileParts = message.parts.filter((part) => part.type === "file");
  const textContent = textParts.map((part) => part.text).join("\n");

  const [draftContent, setDraftContent] = useState(textContent);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/capi/protected/messages/delete-trailing/${message.id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      checkResponse(response, globalT.globalErrors);

      setMessages((messages) => {
        const index = messages.findIndex((m) => m.id === message.id);

        if (index !== -1) {
          const updatedMessage = {
            ...message,
            parts: [{ type: "text", text: draftContent }, ...fileParts],
          } as MyUIMessage;

          return [...messages.slice(0, index), updatedMessage];
        }

        return messages;
      });

      setIsSubmitting(false);
      setMode("view");

      await regenerate({
        body: {
          id: chatId,
          modelId: selectedChatModel.id,
          temp: isTemporary,
        },
      });
    } catch (error) {
      setIsSubmitting(false);
      setMode("view");

      toast.error("Failed to update message");
    }
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            className="text-muted-foreground rounded-full opacity-0 group-hover/message:opacity-100"
            onClick={() => {
              setMode("view");
            }}
          >
            <X />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Cancel</TooltipContent>
      </Tooltip>
      <div className="border-primary flex w-3/4 space-x-2 rounded-xl border px-3 py-2">
        <TextareaAutosize
          autoFocus
          value={draftContent}
          onChange={(event) => setDraftContent(event.target.value)}
          rows={1}
          tabIndex={0}
          className={"w-full resize-none outline-none"}
          onKeyDown={(event: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();

              if (!isSubmitting) {
                handleSubmit();
              }
            }
          }}
        />
        <div className="flex flex-col justify-end">
          <SendButton
            input={draftContent}
            submitForm={handleSubmit}
            uploadQueue={[]}
          />
        </div>
      </div>
    </>
  );
};

export const MessageEditor = memo(PureMessageEditor, (prevProps, nextProps) => {
  if (prevProps.chatId !== nextProps.chatId) return false;
  if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;

  return true;
});
