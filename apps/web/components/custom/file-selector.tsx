"use client";

import { useFilter } from "@/contexts/filter-context";
import { useWebTranslations } from "@/contexts/web-translations";
import { Button } from "@workspace/ui/components/button";
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
import { FilesList } from "./add-context-lists";
import { SearchWithSelection } from "./search-with-selection";

export const FileSelector = memo(() => {
  const { isLoading, isError, filter } = useFilter();
  const { webT } = useWebTranslations();

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  if (isLoading) {
    return <Skeleton className="h-9 w-40 rounded-xl" />;
  }

  if (isError || !filter.bucket.id) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className={cn(
            "rounded-xl",
            filter.files.length === 0 ? "border-red-500" : "border-green-500",
          )}
          onClick={() => setOpen((open) => !open)}
          variant="outline"
        >
          {webT.fileSelector.filesSelected.replace(
            "{count}",
            filter.files.length.toString(),
          )}
          <kbd className="bg-muted text-muted-foreground inline-flex h-5 items-center gap-1 rounded-xl border px-1.5 font-mono font-medium">
            <span className="text-xs">⌘</span>j
          </kbd>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{webT.fileSelector.searchFiles}</DialogTitle>
        </DialogHeader>
        <SearchWithSelection
          type="files"
          inputValue={inputValue}
          onInputChange={(value) => setInputValue(value)}
        />
        <FilesList
          open={open}
          setOpen={setOpen}
          inputValue={inputValue}
          max={3}
        />
      </DialogContent>
    </Dialog>
  );
});
