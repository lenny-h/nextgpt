import { useIsTemporary } from "@/contexts/temporary-chat-context";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { CircleStop } from "lucide-react";
import { memo } from "react";

interface StopButtonProps {
  stop: () => void;
}

const PureStopButton: React.FC<StopButtonProps> = ({ stop }) => {
  const [isTemporary] = useIsTemporary();

  return (
    <Button
      className={cn(
        "rounded-xl",
        isTemporary && "bg-background text-foreground hover:bg-background/85",
      )}
      onClick={(event) => {
        event.preventDefault();
        stop();
      }}
    >
      <CircleStop size={14} />
    </Button>
  );
};

export const StopButton = memo(PureStopButton);
