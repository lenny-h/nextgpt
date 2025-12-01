"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";

import { cn } from "@workspace/ui/lib/utils";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useState } from "react";

interface Item {
  id: string;
  name: string;
}

interface GenericSelectorProps {
  items: Item[] | undefined;
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  isLoading?: boolean;
  error?: unknown;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  errorMessage: string;
  noItemsMessage: string;
}

export function Selector({
  items,
  selectedId,
  onSelect,
  isLoading = false,
  error,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  errorMessage,
  noItemsMessage,
}: GenericSelectorProps) {
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return <Loader2 className="animate-spin" />;
  }

  if (error) {
    return <div className="text-muted-foreground text-sm">{errorMessage}</div>;
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-muted-foreground text-sm">{noItemsMessage}</div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          onClick={() => setOpen(true)}
          className={cn(
            `flex w-[200px]`,
            !selectedId && "text-muted-foreground",
          )}
        >
          <p className="flex-1 truncate text-left">
            {selectedId
              ? items.find((item) => item.id === selectedId)?.name
              : placeholder}
          </p>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={`w-[200px] p-0`}>
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-9" />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  value={item.id}
                  key={item.id}
                  onSelect={() => {
                    onSelect(item.id);
                    setOpen(false);
                  }}
                >
                  {item.name}
                  <Check
                    className={cn(
                      "ml-auto",
                      item.id === selectedId ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
