"use client";

import { usePdf } from "@/contexts/pdf-context";
import { useRefs } from "@/contexts/refs-context";
import { type DocumentSource } from "@workspace/api-routes/types/document-source";
import { Badge } from "@workspace/ui/components/badge";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { cn } from "@workspace/ui/lib/utils";
import { File } from "lucide-react";

interface SourceBadgeProps {
  source: DocumentSource;
  className?: string;
}

export function SourceBadge({ source, className }: SourceBadgeProps) {
  const isMobile = useIsMobile();

  const { panelRef } = useRefs();
  const { openPdf } = usePdf();

  return (
    <Badge
      onClick={() =>
        openPdf(
          isMobile,
          panelRef,
          source.courseId,
          source.fileName,
          source.pageIndex + 1,
        )
      }
      className={cn(
        "bg-primary/10 hover:bg-primary/20 inline-flex cursor-pointer items-center gap-1 rounded text-xs font-medium transition-colors",
        className,
      )}
    >
      <File size={10} className="text-primary" />
      <span className="text-foreground">
        {source.fileName.split(".")[0]}, p.{source.pageIndex + 1}
      </span>
    </Badge>
  );
}
