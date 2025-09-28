import { usePdf } from "@/contexts/pdf-context";
import { useRefs } from "@/contexts/refs-context";
import { type DocumentSource } from "@/types/document-source";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { cn } from "@workspace/ui/lib/utils";
import { File } from "lucide-react";

interface Props {
  sources: DocumentSource[];
  isLoading: boolean;
}

export const SourcesList = ({ sources, isLoading }: Props) => {
  const isMobile = useIsMobile();

  const { panelRef, size } = useRefs();
  const { openPdf } = usePdf();

  if (isLoading) {
    return (
      <div
        className={cn(
          "grid w-full max-w-4xl grid-cols-1 gap-2",
          panelRef.current?.isCollapsed()
            ? "md:grid-cols-2 xl:grid-cols-3"
            : size < 60
              ? "xl:grid-cols-2"
              : "xl:grid-cols-1",
        )}
      >
        {Array.from({ length: 10 }).map((_, index) => (
          <div
            key={index}
            className="border-primary/30 flex h-20 w-full items-center space-x-2 rounded-md border p-2"
          >
            <Skeleton className="h-full w-10" />
            <div className="flex flex-1 flex-col items-start space-y-1 overflow-x-hidden">
              <div className="flex w-full items-center space-x-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-5 w-12" />
              </div>
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <p className="text-muted-foreground w-full py-8 text-center text-sm">
        No results found
      </p>
    );
  }

  return (
    <div
      className={cn(
        "grid w-full max-w-4xl grid-cols-1 gap-2",
        panelRef.current?.isCollapsed()
          ? "md:grid-cols-2 xl:grid-cols-3"
          : size < 60
            ? "xl:grid-cols-2"
            : "xl:grid-cols-1",
      )}
    >
      {sources.map((source) => (
        <button
          key={source.id}
          className="border-primary flex h-20 w-full cursor-pointer items-center space-x-2 rounded-md border p-2"
          onClick={() =>
            openPdf(
              isMobile,
              panelRef,
              source.courseId,
              source.fileName,
              source.pageIndex + 1,
            )
          }
        >
          <File className="text-primary h-full w-10" />
          <div className="flex flex-1 flex-col space-y-1 overflow-x-hidden">
            <h2 className="w-full truncate text-left text-lg font-semibold">
              {source.fileName}, page {source.pageIndex + 1}
            </h2>
            <p className="text-muted-foreground w-full truncate text-left text-sm">
              {source.courseName}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
};
