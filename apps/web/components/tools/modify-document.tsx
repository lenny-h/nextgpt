import { type MyUITools } from "@/types/custom-ui-tools";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { ToolUIPart } from "ai";
import { ChevronDownIcon, Loader2, Pencil } from "lucide-react";
import { memo, useState } from "react";

export const ModifyDocumentUI = memo(
  ({
    part,
  }: {
    part: ToolUIPart<{
      modifyDocument: MyUITools["modifyDocument"];
    }>;
  }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (part.state === "input-streaming") {
      return (
        <div className="bg-muted/30 flex items-center gap-2 rounded-md border p-2">
          <Loader2 className="text-primary animate-spin" size={16} />
          <span className="text-xs font-medium">
            Processing document modification...
          </span>
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
          <CollapsibleTrigger className="bg-muted/50 flex w-full cursor-pointer items-center justify-between p-2 text-xs font-medium">
            <div className="flex items-center gap-2">
              <Pencil size={14} className="text-primary" />
              <span>Modifying document</span>
            </div>
            <ChevronDownIcon className={isOpen ? "rotate-180" : ""} size={14} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-2">
              <div className="text-muted-foreground text-xxs mb-1">
                Instructions:
              </div>
              <div className="bg-muted/30 rounded-md p-2 text-xs">
                {part.input.instructions}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      );
    }

    if (part.state === "output-available") {
      return (
        <div className="flex items-start gap-2 rounded-md border bg-green-100 p-2 dark:bg-green-900/20">
          <Pencil className="mt-0.5 text-green-600" size={16} />
          <div className="flex-1">
            <p className="text-xs font-medium text-green-700 dark:text-green-300">
              Document modification completed
            </p>
          </div>
        </div>
      );
    }

    return null;
  },
);
