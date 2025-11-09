import { type MyUITools } from "@workspace/api-routes/types/custom-ui-tools";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { type ToolUIPart } from "ai";
import { ChevronDownIcon, Globe, Loader2 } from "lucide-react";
import { memo, useState } from "react";

export const RetrieveWebPagesUI = memo(
  ({
    part,
  }: {
    part: ToolUIPart<{
      retrieveWebPages: MyUITools["retrieveWebPages"];
    }>;
  }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (part.state === "input-streaming") {
      return (
        <div className="bg-muted/30 flex items-center gap-3 rounded-md border p-3">
          <Loader2 className="text-primary animate-spin" size={18} />
          <span className="text-sm font-medium">
            Processing web page retrieval...
          </span>
        </div>
      );
    }

    if (part.state === "input-available") {
      return (
        <div className="bg-muted/30 flex items-start gap-3 rounded-md border p-3">
          <Globe className="text-primary mt-0.5" size={18} />
          <div className="flex-1">
            <p className="mb-1.5 text-sm font-medium">Retrieving web pages:</p>
            {part.input.urls && part.input.urls.length > 0 && (
              <div className="space-y-1">
                {part.input.urls.map((url: string, index: number) => (
                  <div key={index} className="text-muted-foreground text-sm">
                    • {url}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (part.state === "output-available" && part.output?.webSources) {
      const pages = part.output.webSources;

      return (
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className="border-border/50 w-full overflow-hidden rounded-md border"
        >
          <CollapsibleTrigger className="bg-muted/50 flex w-full cursor-pointer items-center justify-between p-3 text-sm font-medium">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-primary" />
              <span>Retrieved Pages ({pages.length})</span>
            </div>
            <ChevronDownIcon className={isOpen ? "rotate-180" : ""} size={16} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-1.5 p-3 text-sm">
              {pages.map((page, index) => (
                <div
                  key={index}
                  className="bg-muted/30 hover:bg-muted/50 flex cursor-pointer flex-col gap-1.5 rounded-md border p-3 transition-colors"
                  onClick={() => window.open(page.url, "_blank")}
                >
                  <div className="flex items-center gap-2">
                    <Globe size={14} className="text-primary" />
                    <span className="font-medium">{page.url}</span>
                  </div>
                  {page.pageContent && (
                    <p className="text-muted-foreground ml-6 mt-1 line-clamp-3 text-sm">
                      {page.pageContent.substring(0, 100)}...
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return null;
  },
);
