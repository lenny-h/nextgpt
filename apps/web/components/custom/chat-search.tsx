"use client";

import { useWebTranslations } from "@/contexts/web-translations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { memo, ReactNode, useEffect, useState } from "react";
import { ChatsList } from "../editors/load-button-lists";
import { SearchWithSelection } from "./search-with-selection";

export const ChatSearch = memo(({ children }: { children: ReactNode }) => {
  const { webT } = useWebTranslations();

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "a" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{webT.chatSearch.searchChats}</DialogTitle>
        </DialogHeader>
        <SearchWithSelection
          type="chats"
          inputValue={inputValue}
          onInputChange={setInputValue}
          showCurrentSelection={false}
        />
        <ChatsList open={open} setOpen={setOpen} inputValue={inputValue} />
      </DialogContent>
    </Dialog>
  );
});
