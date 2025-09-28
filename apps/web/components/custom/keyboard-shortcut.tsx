import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { FC } from "react";

interface KeyboardShortcutProps {
  keys: string[];
}

export const KeyboardShortcut: FC<KeyboardShortcutProps> = ({ keys }) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return null;
  }

  return (
    <kbd className="bg-muted text-muted-foreground inline-flex h-5 items-center gap-1 rounded-xl border px-1.5 font-mono font-medium">
      {keys.map((key, index) => (
        <span key={index} className={key === "⌘" ? "text-xs" : ""}>
          {key}
        </span>
      ))}
    </kbd>
  );
};
