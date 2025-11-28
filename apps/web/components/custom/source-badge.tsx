"use client";

import { usePdf } from "@/contexts/pdf-context";
import { type DocumentSource } from "@workspace/api-routes/types/document-source";
import { Badge } from "@workspace/ui/components/badge";
import { useRefs } from "@workspace/ui/contexts/refs-context";
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

  const isPdf = source.fileName.toLowerCase().endsWith(".pdf");

  const handleClick = () => {
    if (isPdf) {
      openPdf(
        isMobile,
        panelRef,
        source.courseId,
        source.fileName,
        source.pageIndex + 1,
        source.bbox || null,
      );
    }
  };

  return (
    <Badge
      onClick={handleClick}
      className={cn(
        "bg-primary/10 inline-flex items-center gap-1 rounded text-xs font-medium transition-colors",
        isPdf
          ? "hover:bg-primary/20 cursor-pointer"
          : "cursor-default opacity-75",
        className,
      )}
    >
      <File size={10} className="text-primary" />
      <span className="text-foreground">
        {source.fileName}, p.{source.pageIndex + 1}
      </span>
    </Badge>
  );
}
