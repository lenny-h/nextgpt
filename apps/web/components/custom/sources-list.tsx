import { usePdf } from "@/contexts/pdf-context";
import { useWebTranslations } from "@/contexts/web-translations";
import { type DocumentSource } from "@workspace/api-routes/types/document-source";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useRefs } from "@workspace/ui/contexts/refs-context";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { cn } from "@workspace/ui/lib/utils";
import { File } from "lucide-react";

interface Props {
  sources: DocumentSource[];
  isLoading: boolean;
}

export const SourcesList = ({ sources, isLoading }: Props) => {
  const { webT } = useWebTranslations();
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
        {webT.documentsList.noResultsFound}
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
      {sources.map((source) => {
        const isPdf = source.fileName.toLowerCase().endsWith(".pdf");
        return (
          <button
            key={source.id}
            className={cn(
              "border-primary flex h-20 w-full items-center space-x-2 rounded-md border p-2",
              isPdf
                ? "hover:bg-muted/50 cursor-pointer"
                : "cursor-default opacity-75",
            )}
            onClick={() => {
              if (isPdf) {
                openPdf(
                  isMobile,
                  panelRef,
                  source.courseId,
                  source.fileName,
                  source.pageIndex + 1,
                );
              }
            }}
            disabled={!isPdf}
          >
            <File className="text-primary h-full w-10" />
            <div className="flex flex-1 flex-col space-y-1 overflow-x-hidden">
              <div className="flex items-center gap-2">
                <h2 className="flex-1 truncate text-left text-lg font-semibold">
                  {source.fileName}, p. {source.pageIndex + 1}
                </h2>
                {!isPdf && (
                  <span className="text-muted-foreground text-[10px] italic">
                    {webT.documentsList.previewUnavailable}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground w-full truncate text-left text-sm">
                {source.courseName}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};
