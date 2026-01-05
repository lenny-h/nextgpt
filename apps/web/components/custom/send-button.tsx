import { useIsTemporary } from "@/contexts/temporary-chat-context";
import { useWebTranslations } from "@/contexts/web-translations";
import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
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
    const { webT } = useWebTranslations();
    const [isTemporary] = useIsTemporary();

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className={cn(
              "rounded-xl",
              isTemporary &&
                "bg-background text-foreground hover:bg-background/85",
            )}
            disabled={input.length === 0 || uploadQueue.length > 0}
            onClick={(event) => {
              event.preventDefault();
              submitForm();
            }}
          >
            <ArrowUp size={14} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{webT.multimodal.sendMessage}</TooltipContent>
      </Tooltip>
    );
  },
);

export const SendButton = memo(PureSendButton);
