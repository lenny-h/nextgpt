import { useChatModel } from "@/contexts/selected-chat-model";
import { useIsTemporary } from "@/contexts/temporary-chat-context";
import { useWebTranslations } from "@/contexts/web-translations";
import { cn } from "@workspace/ui/lib/utils";
import { memo } from "react";

const PureReasoningButton = () => {
  const { webT } = useWebTranslations();

  const { selectedChatModel, reasoningEnabled, setReasoningEnabled } =
    useChatModel();
  const [isTemporary] = useIsTemporary();

  if (!selectedChatModel.reasoning) {
    return null;
  }

  return (
    <button
      className={cn(
        "inline-flex cursor-pointer items-center justify-center rounded-full border px-2 py-1 text-xs font-medium transition-colors",
        isTemporary && "bg-background text-foreground hover:bg-background/85",
        reasoningEnabled && "border-primary",
      )}
      onClick={(event) => {
        event.preventDefault();
        setReasoningEnabled(!reasoningEnabled);
      }}
      type="button"
    >
      {webT.reasoningButton.reasoning}
    </button>
  );
};

export const ReasoningButton = memo(PureReasoningButton);
