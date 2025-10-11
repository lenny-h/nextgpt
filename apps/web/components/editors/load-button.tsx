"use client";

import { useFilter } from "@/contexts/filter-context";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { memo, useEffect, useState } from "react";
import { KeyboardShortcut } from "../custom/keyboard-shortcut";
import { SearchWithSelection } from "../custom/search-with-selection";
import { DocumentsList, FilesList } from "./load-button-lists";

interface LoadButtonProps {
  type: "files" | "documents";
}

export const LoadButton = memo(({ type }: LoadButtonProps) => {
  const { isLoading, isError, filter } = useFilter();

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "o" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  if (isLoading) {
    return <Skeleton className="w-22 h-9 rounded-md" />;
  }

  if (isError || !filter.bucket.id) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="px-2" variant="outline">
          Load
          <KeyboardShortcut keys={["⌘", "o"]} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Search {type}</DialogTitle>
        </DialogHeader>
        <SearchWithSelection
          type={type}
          inputValue={inputValue}
          onInputChange={(value) => setInputValue(value)}
          showCurrentSelection={false}
        />
        {type === "files" ? (
          <FilesList open={open} setOpen={setOpen} inputValue={inputValue} />
        ) : (
          <DocumentsList
            open={open}
            setOpen={setOpen}
            inputValue={inputValue}
          />
        )}
      </DialogContent>
    </Dialog>
  );
});
