import { usePdf } from "@/contexts/pdf-context";
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
      retrieveDocumentSources: MyUITools["retrieveDocumentSources"];
    }>;
  }) => {
    console.log("RetrieveDocumentSourcesUI part:", part);
    console.log("Part state:", part.state);

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
        <div className="bg-muted/30 flex items-center gap-2 rounded-md border p-2">
          <Loader2 className="text-primary animate-spin" size={16} />
          <span className="text-xs font-medium">
            Processing document search request...
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
        <div className="bg-muted/30 flex items-start gap-2 rounded-md border p-2">
          <File className="text-primary mt-0.5" size={16} />
          <div className="flex-1">
            <p className="mb-1 text-xs font-medium">
              Searching documents with:
            </p>
            {currentItem && (
              <div className="mb-1">
                <span className="text-muted-foreground text-xs">
                  {currentItem.label}:{" "}
                </span>
                <span className="text-xs">
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

    if (part.state === "output-available" && part.output?.docSources) {
      const sources = part.output.docSources;

      return (
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className="border-border/50 w-full overflow-hidden rounded-md border"
        >
          <CollapsibleTrigger className="bg-muted/50 flex w-full cursor-pointer items-center justify-between p-2 text-xs font-medium">
            <div className="flex items-center gap-2">
              <File size={14} className="text-primary" />
              <span>Document Sources ({sources.length})</span>
            </div>
            <ChevronDownIcon className={isOpen ? "rotate-180" : ""} size={14} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-1 p-2 text-xs">
              {sources.map((source) => {
                const isPdf = source.fileName.toLowerCase().endsWith(".pdf");
                return (
                  <div
                    key={source.id}
                    className={cn(
                      "flex flex-col gap-1 rounded-md border p-2 transition-colors",
                      isPdf
                        ? "bg-muted/30 hover:bg-muted/50 cursor-pointer"
                        : "bg-muted/20 cursor-default opacity-75",
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
                  >
                    <div className="flex items-center gap-2">
                      <File
                        size={12}
                        className={
                          isPdf ? "text-primary" : "text-muted-foreground"
                        }
                      />
                      <span className="font-medium">
                        {source.fileName}, page {source.pageIndex + 1}
                      </span>
                      {!isPdf && (
                        <span className="text-muted-foreground ml-auto text-[10px] italic">
                          Preview unavailable
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground ml-5 text-xs">
                      Course: {source.courseName}
                    </p>
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
