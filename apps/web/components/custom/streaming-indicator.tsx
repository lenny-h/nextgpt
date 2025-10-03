"use client";

import { cn } from "@workspace/ui/lib/utils";
import { memo } from "react";

interface StreamingIndicatorProps {
  className?: string;
}

export const StreamingIndicator = memo(
  ({ className }: StreamingIndicatorProps) => {
    return (
      <div
        className={cn(
          "text-muted-foreground flex items-center gap-3 px-2 text-sm",
          className,
        )}
      >
        <div className="flex gap-1">
          <div
            className="bg-primary/60 h-2 w-2 animate-bounce rounded-full"
            style={{ animationDelay: "0ms", animationDuration: "1.4s" }}
          />
          <div
            className="bg-primary/60 h-2 w-2 animate-bounce rounded-full"
            style={{ animationDelay: "0.2s", animationDuration: "1.4s" }}
          />
          <div
            className="bg-primary/60 h-2 w-2 animate-bounce rounded-full"
            style={{ animationDelay: "0.4s", animationDuration: "1.4s" }}
          />
        </div>
      </div>
    );
  },
);
