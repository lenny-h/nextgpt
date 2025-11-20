import { useWebTranslations } from "@/contexts/web-translations";
import { type MyUITools } from "@workspace/api-routes/types/custom-ui-tools";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { type ToolUIPart } from "ai";
import { ChevronDownIcon, Globe, Loader2 } from "lucide-react";
import { memo, useState } from "react";

export const ScrapeUrlUI = memo(
  ({
    part,
  }: {
    part: ToolUIPart<{
      scrapeUrl: MyUITools["scrapeUrl"];
    }>;
  }) => {
    const { webT } = useWebTranslations();
    const [isOpen, setIsOpen] = useState(false);

    if (part.state === "input-streaming") {
      return (
        <div className="bg-muted/30 flex items-center gap-3 rounded-md border p-3">
          <Loader2 className="text-primary animate-spin" size={18} />
          <span className="text-sm font-medium">
            {webT.tools.processingWebPages}
          </span>
        </div>
      );
    }

    if (part.state === "input-available") {
      return (
        <div className="bg-muted/30 flex items-start gap-3 rounded-md border p-3">
          <Globe className="text-primary mt-0.5" size={18} />
          <div className="flex-1">
            <p className="mb-1.5 text-sm font-medium">
              {webT.tools?.retrievingWebPages}
            </p>
            {part.input.urlToScrape && (
              <div className="space-y-1">
                <div className="text-muted-foreground text-sm">
                  • {part.input.urlToScrape}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (part.state === "output-available" && part.output) {
      // Output is markdown string
      const preview =
        typeof part.output === "string" ? part.output.substring(0, 300) : "";

      return (
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className="border-border/50 w-full overflow-hidden rounded-md border"
        >
          <CollapsibleTrigger className="bg-muted/50 flex w-full cursor-pointer items-center justify-between p-3 text-sm font-medium">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-primary" />
              <span>{webT.tools.retrievedPages}</span>
            </div>
            <ChevronDownIcon className={isOpen ? "rotate-180" : ""} size={16} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="text-sm">
              <div className="hover:bg-muted/50 px-3 py-2 transition-colors">
                <Globe size={14} className="text-primary mb-2 shrink-0" />
                <div className="overflow-hidden">
                  <p className="text-muted-foreground whitespace-pre-wrap text-xs">
                    {preview}...
                  </p>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return null;
  },
);
