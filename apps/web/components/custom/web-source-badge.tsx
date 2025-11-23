"use client";

import { type NormalizedWebSource } from "@workspace/api-routes/types/web-source";
import { Badge } from "@workspace/ui/components/badge";
import { cn } from "@workspace/ui/lib/utils";
import { Globe } from "lucide-react";

interface WebSourceBadgeProps {
  source: NormalizedWebSource;
  className?: string;
}

export function WebSourceBadge({ source, className }: WebSourceBadgeProps) {
  if (!source.url) {
    return (
      <Badge
        className={cn(
          "bg-primary/10 hover:bg-primary/20 inline-flex cursor-pointer items-center gap-1 rounded text-xs font-medium transition-colors",
          className,
        )}
      >
        <Globe size={10} className="text-primary" />
        <span className="text-foreground">{source.title}</span>
      </Badge>
    );
  }

  return (
    <Badge
      onClick={() => window.open(source.url, "_blank")}
      className={cn(
        "bg-primary/10 hover:bg-primary/20 inline-flex cursor-pointer items-center gap-1 rounded text-xs font-medium transition-colors",
        className,
      )}
    >
      <Globe size={10} className="text-primary" />
      <span className="text-foreground">
        {new URL(source.url).hostname.replace("www.", "")}
      </span>
    </Badge>
  );
}
