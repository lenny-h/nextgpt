import { useIsTemporary } from "@/contexts/temporary-chat-context";
import { cn } from "@workspace/ui/lib/utils";
import React from "react";
import TextareaAutosize from "react-textarea-autosize";
import { toast } from "sonner";

interface TextareaProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  submitForm: () => void;
}

export const Textarea: React.FC<TextareaProps> = ({
  textareaRef,
  input,
  setInput,
  isLoading,
  submitForm,
}) => {
  const [isTemporary] = useIsTemporary();

  return (
    <TextareaAutosize
      autoFocus
      ref={textareaRef}
      value={input}
      onChange={(event) => setInput(event.target.value)}
      rows={2}
      maxRows={4}
      tabIndex={0}
      placeholder="Ask a question..."
      className={cn(
        "min-h-12 w-full resize-none px-4 pt-3 text-base outline-none",
        isTemporary
          ? "placeholder:text-muted"
          : "placeholder:text-muted-foreground",
      )}
      onKeyDown={(event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();

          if (isLoading) {
            toast.error("Please wait for the model to finish its response!");
          } else {
            submitForm();
          }
        }
      }}
    />
  );
};
