import { usePdf } from "@/contexts/pdf-context";
import { useWebTranslations } from "@/contexts/web-translations";
import { type MyUITools } from "@workspace/api-routes/types/custom-ui-tools";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { useRefs } from "@workspace/ui/contexts/refs-context";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { cn } from "@workspace/ui/lib/utils";
import { type ToolUIPart } from "ai";
import { ChevronDownIcon, File, Loader2 } from "lucide-react";
import { memo, useEffect, useState } from "react";

export const RetrieveDocumentSourcesUI = memo(
  ({
    part,
  }: {
    part: ToolUIPart<{
      searchDocuments: MyUITools["searchDocuments"];
    }>;
  }) => {
    console.log("RetrieveDocumentSourcesUI part:", part);

    const { webT } = useWebTranslations();
    const [isOpen, setIsOpen] = useState(false);
    const [currentDisplayIndex, setCurrentDisplayIndex] = useState(0);

    const { panelRef } = useRefs();
    const { openPdf } = usePdf();

    const isMobile = useIsMobile();

    // Rotation logic for input display
    useEffect(() => {
      if (part.state === "input-available" && part.input) {
        const availableItems = [];
        if (part.input.keywords && part.input.keywords.length > 0) {
          availableItems.push("keywords");
        }
        if (part.input.questions && part.input.questions.length > 0) {
          availableItems.push("questions");
        }
        if (part.input.pageNumbers && part.input.pageNumbers.length > 0) {
          availableItems.push("pageNumbers");
        }

        if (availableItems.length > 1) {
          const interval = setInterval(() => {
            setCurrentDisplayIndex(
              (prev) => (prev + 1) % availableItems.length,
            );
          }, 3000);

          return () => clearInterval(interval);
        }
      }
    }, [part.state, part.input]);

    if (part.state === "input-streaming") {
      return (
        <div className="bg-muted/30 flex items-center gap-3 rounded-md border p-3">
          <Loader2 className="text-primary animate-spin" size={18} />
          <span className="text-sm font-medium">
            {webT.tools.processingDocumentSearch}
          </span>
        </div>
      );
    }

    if (part.state === "input-available") {
      const availableItems = [];
      if (part.input.keywords && part.input.keywords.length > 0) {
        availableItems.push({
          type: "keywords",
          label: "Keywords",
          data: part.input.keywords,
        });
      }
      if (part.input.questions && part.input.questions.length > 0) {
        availableItems.push({
          type: "questions",
          label: "Questions",
          data: part.input.questions,
        });
      }
      if (part.input.pageNumbers && part.input.pageNumbers.length > 0) {
        availableItems.push({
          type: "pageNumbers",
          label: "Pages",
          data: part.input.pageNumbers,
        });
      }

      const currentItem =
        availableItems[currentDisplayIndex % availableItems.length];

      return (
        <div className="bg-muted/30 flex items-start gap-3 rounded-md border p-3">
          <File className="text-primary mt-0.5" size={18} />
          <div className="flex-1">
            <p className="mb-1.5 text-sm font-medium">
              {webT.tools?.searchingDocuments ?? "Searching documents with:"}
            </p>
            {currentItem && (
              <div className="mb-1">
                <span className="text-muted-foreground text-sm">
                  {webT.tools?.[currentItem.type as keyof typeof webT.tools] ??
                    currentItem.label}
                  :{" "}
                </span>
                <span className="text-sm">
                  {Array.isArray(currentItem.data)
                    ? currentItem.data.join(", ")
                    : currentItem.data}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (part.state === "output-available" && part.output.docSources) {
      // Sort sources by filename, then by page number
      const sources = [...part.output.docSources].sort((a, b) => {
        const fileCompare = a.fileName.localeCompare(b.fileName);
        if (fileCompare !== 0) return fileCompare;
        return a.pageIndex - b.pageIndex;
      });

      return (
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className="border-border/50 w-full overflow-hidden rounded-md border"
        >
          <CollapsibleTrigger className="bg-muted/50 flex w-full cursor-pointer items-center justify-between p-3 text-sm font-medium">
            <div className="flex items-center gap-2">
              <File size={16} className="text-primary" />
              <span>
                {webT.tools.documentSources} ({sources.length})
              </span>
            </div>
            <ChevronDownIcon className={isOpen ? "rotate-180" : ""} size={16} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="divide-y text-sm">
              {sources.map((source) => {
                const isPdf = source.fileName.toLowerCase().endsWith(".pdf");
                return (
                  <div
                    key={source.id}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 transition-colors",
                      isPdf
                        ? "hover:bg-muted/50 cursor-pointer"
                        : "cursor-default opacity-75",
                    )}
                    onClick={() => {
                      if (isPdf) {
                        console.log("Opening PDF with bbox:", source.bbox);
                        openPdf(
                          isMobile,
                          panelRef,
                          source.courseId,
                          source.fileName,
                          source.pageIndex + 1,
                          source.bbox || null,
                        );
                      }
                    }}
                  >
                    <File
                      size={14}
                      className={
                        isPdf
                          ? "text-primary shrink-0"
                          : "text-muted-foreground shrink-0"
                      }
                    />
                    <span className="font-medium">
                      {source.fileName}, {webT.tools?.page ?? "p"}.
                      {source.pageIndex + 1}
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">
                      {source.courseName}
                    </span>
                    {!isPdf && (
                      <span className="text-muted-foreground ml-auto text-xs italic">
                        {webT.documentsList.previewUnavailable}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return null;
  },
);
