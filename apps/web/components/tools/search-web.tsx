import { useWebTranslations } from "@/contexts/web-translations";
import { type MyUITools } from "@workspace/api-routes/types/custom-ui-tools";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { type ToolUIPart } from "ai";
import { ChevronDownIcon, Globe, Loader2, Search } from "lucide-react";
import { memo, useState } from "react";

export const SearchWebUI = memo(
  ({
    part,
  }: {
    part: ToolUIPart<{
      searchWeb: MyUITools["searchWeb"];
    }>;
  }) => {
    const { webT } = useWebTranslations();
    const [isOpen, setIsOpen] = useState(false);

    console.log("SearchWebUI rendering with part:", part);

    if (part.state === "input-streaming") {
      return (
        <div className="bg-muted/30 flex items-center gap-3 rounded-md border p-3">
          <Loader2 className="text-primary animate-spin" size={18} />
          <span className="text-sm font-medium">
            {webT.tools.processingWebSearch}
          </span>
        </div>
      );
    }

    if (part.state === "input-available") {
      return (
        <div className="bg-muted/30 flex items-start gap-3 rounded-md border p-3">
          <Search className="text-primary mt-0.5" size={18} />
          <div className="flex-1">
            <p className="mb-1.5 text-sm font-medium">
              {webT.tools.searchingWeb}
            </p>
            {part.input.searchTerms && (
              <div className="space-y-1">
                <div className="text-muted-foreground text-sm">
                  • {part.input.searchTerms}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (part.state === "output-available" && part.output) {
      // Sort pages by URL
      const pages = [...part.output].sort((a, b) => a.url.localeCompare(b.url));

      return (
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className="border-border/50 w-full overflow-hidden rounded-md border"
        >
          <CollapsibleTrigger className="bg-muted/50 flex w-full cursor-pointer items-center justify-between p-3 text-sm font-medium">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-primary" />
              <span>
                {webT.tools.webSources} ({pages.length})
              </span>
            </div>
            <ChevronDownIcon className={isOpen ? "rotate-180" : ""} size={16} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="divide-y text-sm">
              {pages.map((page, index) => (
                <div
                  key={index}
                  className="hover:bg-muted/50 flex cursor-pointer items-start gap-2 px-3 py-2 transition-colors"
                  onClick={() => window.open(page.url, "_blank")}
                >
                  <Globe size={14} className="text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 overflow-hidden">
                    <span className="font-medium">
                      {page.title || page.url}
                    </span>
                    {page.description && (
                      <p className="text-muted-foreground line-clamp-2 text-xs">
                        {page.description}
                      </p>
                    )}
                  </div>
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
