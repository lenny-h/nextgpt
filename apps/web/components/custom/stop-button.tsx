import { useIsTemporary } from "@/contexts/temporary-chat-context";
import { useWebTranslations } from "@/contexts/web-translations";
import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import { CircleStop } from "lucide-react";
import { memo } from "react";

interface StopButtonProps {
  stop: () => void;
}

const PureStopButton: React.FC<StopButtonProps> = ({ stop }) => {
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
          onClick={(event) => {
            event.preventDefault();
            stop();
          }}
        >
          <CircleStop size={14} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{webT.multimodal.stopGeneration}</TooltipContent>
    </Tooltip>
  );
};

export const StopButton = memo(PureStopButton);
