"use client";

import { useFilter } from "@/contexts/filter-context";
import { useIsTemporary } from "@/contexts/temporary-chat-context";
import { useWebTranslations } from "@/contexts/web-translations";
import { Badge } from "@workspace/ui/components/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";
import { memo, useEffect, useState } from "react";
import { DocumentsList, FilesList } from "./add-context-lists";
import { SearchWithSelection } from "./search-with-selection";

interface AddContextProps {
  type: "files" | "documents";
}

export const AddContext = memo(({ type }: AddContextProps) => {
  const { webT } = useWebTranslations();

  const { isLoading, isError } = useFilter();
  const [isTemporary] = useIsTemporary();

  const shortcut = type === "files" ? "j" : "k";

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === shortcut && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [shortcut]);

  if (isLoading) {
    return <Skeleton className="h-6 w-16 rounded-md" />;
  }

  if (isError) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Badge
          className={cn(
            "inline-flex cursor-pointer items-center gap-1 rounded-md text-xs font-medium transition-colors",
            isTemporary
              ? "bg-muted/30 hover:bg-muted/40 text-background"
              : "bg-primary/20 hover:bg-primary/30 text-foreground",
          )}
          onClick={() => setOpen((open) => !open)}
        >
          {type === "files" ? webT.addContext.addFiles : webT.addContext.addDocuments}
          <kbd className="bg-muted text-muted-foreground inline-flex h-4 items-center gap-1 rounded-xl border px-1.5 font-mono font-medium">
            <span className="text-xs">⌘</span>
            {shortcut}
          </kbd>
        </Badge>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{type === "files" ? webT.addContext.searchFiles : webT.addContext.searchDocuments}</DialogTitle>
        </DialogHeader>
        <SearchWithSelection
          type={type}
          inputValue={inputValue}
          onInputChange={(value) => setInputValue(value)}
        />
        {type === "files" ? (
          <FilesList
            open={open}
            setOpen={setOpen}
            inputValue={inputValue}
            max={5}
          />
        ) : (
          <DocumentsList
            open={open}
            setOpen={setOpen}
            inputValue={inputValue}
            max={1}
          />
        )}
      </DialogContent>
    </Dialog>
  );
});
