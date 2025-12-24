"use client";

import { useChatModel } from "@/contexts/selected-chat-model";
import { chatModels } from "@/lib/models";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { cn } from "@workspace/ui/lib/utils";
import { Check, ChevronDownIcon } from "lucide-react";
import { memo, useState } from "react";

export const ModelSelector = memo(() => {
  const { selectedChatModel, setSelectedChatModel } = useChatModel();

  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="min-w-0 shrink rounded-lg">
          <span className="truncate">{selectedChatModel.label}</span>
          <ChevronDownIcon
            className={cn(
              "ml-1 transition-transform duration-200 ease-in-out",
              open && "rotate-180",
            )}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="min-w-75">
        {chatModels.map((chatModel) => {
          return (
            <DropdownMenuItem
              key={chatModel.id}
              onSelect={() => {
                setOpen(false);
                setSelectedChatModel(chatModel);
              }}
              className="flex flex-row items-center justify-between gap-4"
            >
              <div className="flex flex-col items-start gap-1">
                <div>{chatModel.label}</div>
                <div className="text-muted-foreground text-sm">
                  {chatModel.description}
                </div>
              </div>

              {chatModel.id === selectedChatModel.id && (
                <Check className="text-green-500" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
