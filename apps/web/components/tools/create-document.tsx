import { useDocumentHandler } from "@/hooks/use-document-handler";
import { type MyUITools } from "@workspace/api-routes/types/custom-ui-tools";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { type ToolUIPart } from "ai";
import { ChevronDownIcon, FileText, Loader2 } from "lucide-react";
import { memo, useState } from "react";

export const CreateDocumentUI = memo(
  ({
    part,
  }: {
    part: ToolUIPart<{
      createDocument: MyUITools["createDocument"];
    }>;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { handleDocumentToolCallClick } = useDocumentHandler();

    if (part.state === "input-streaming") {
      return (
        <div className="bg-muted/30 flex items-center gap-3 rounded-md border p-3">
          <Loader2 className="text-primary animate-spin" size={18} />
          <span className="text-sm font-medium">Creating document...</span>
        </div>
      );
    }

    if (part.state === "input-available") {
      return (
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className="border-border/50 w-full overflow-hidden rounded-md border"
        >
          <CollapsibleTrigger className="bg-muted/50 flex w-full cursor-pointer items-center justify-between p-3 text-sm font-medium">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-primary" />
              <span>Creating document: {part.input.documentTitle}</span>
            </div>
            <ChevronDownIcon className={isOpen ? "rotate-180" : ""} size={16} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-3">
              <div className="text-muted-foreground text-sm mb-1.5">
                Instructions:
              </div>
              <div className="bg-muted/30 rounded-md p-3 text-sm">
                {part.input.instructions}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      );
    }

    if (part.state === "output-available") {
      return (
        <button
          className="flex w-full items-start gap-3 rounded-md border bg-green-100 p-3 transition-colors hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30"
          onClick={() => {
            if (part.output) {
              handleDocumentToolCallClick(part.output.documentId, false);
            }
          }}
        >
          <FileText className="mt-0.5 text-green-600" size={18} />
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-green-700 dark:text-green-300">
              Document created
            </p>
            {part.output && (
              <p className="text-xs text-green-600 dark:text-green-400">
                Click to view: {part.output.documentTitle}
              </p>
            )}
          </div>
        </button>
      );
    }

    return null;
  },
);
