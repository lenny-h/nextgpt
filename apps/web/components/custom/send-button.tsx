import { useIsTemporary } from "@/contexts/temporary-chat-context";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { ArrowUp } from "lucide-react";
import { memo } from "react";

interface SendButtonProps {
  input: string;
  submitForm: () => void;
  uploadQueue: Array<string>;
}

const PureSendButton: React.FC<SendButtonProps> = memo(
  ({ input, submitForm, uploadQueue }) => {
    const [isTemporary] = useIsTemporary();

    return (
      <Button
        className={cn(
          "rounded-xl",
          isTemporary && "bg-background text-foreground hover:bg-background/85",
        )}
        disabled={input.length === 0 || uploadQueue.length > 0}
        onClick={(event) => {
          event.preventDefault();
          submitForm();
        }}
      >
        <ArrowUp size={14} />
      </Button>
    );
  },
);

export const SendButton = memo(PureSendButton);
