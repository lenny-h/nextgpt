import { useChatModel } from "@/contexts/selected-chat-model";
import { useIsTemporary } from "@/contexts/temporary-chat-context";
import { useWebTranslations } from "@/contexts/web-translations";
import { cn } from "@workspace/ui/lib/utils";
import { memo } from "react";

const PureWebSearchButton = () => {
  const { webT } = useWebTranslations();

  const { webSearchEnabled, setWebSearchEnabled } = useChatModel();
  const [isTemporary] = useIsTemporary();

  // Only show if USE_FIRECRAWL is enabled
  if (process.env.NEXT_PUBLIC_USE_FIRECRAWL !== "true") {
    return null;
  }

  return (
    <button
      className={cn(
        "inline-flex cursor-pointer items-center justify-center rounded-full border px-2 py-1 text-xs font-medium transition-colors",
        isTemporary && "bg-background text-foreground hover:bg-background/85",
        webSearchEnabled && "border-primary",
      )}
      onClick={(event) => {
        event.preventDefault();
        setWebSearchEnabled(!webSearchEnabled);
      }}
      type="button"
    >
      {webT.multimodal.webSearch}
    </button>
  );
};

export const WebSearchButton = memo(PureWebSearchButton);
