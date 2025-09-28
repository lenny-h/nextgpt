import { useInfiniteQueryWithRPC } from "@/hooks/use-infinite-query";
import { createClient } from "@/lib/supabase/client";
import { ArtifactKind } from "@/types/artifact-kind";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Check, Loader2 } from "lucide-react";
import { KeyboardEvent, memo, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export interface ListItem {
  id: string;
  name?: string;
  title?: string;
  kind?: ArtifactKind;
  private?: boolean;
  [key: string]: any;
}

interface FilterableListProps<T extends ListItem> {
  open: boolean;
  inputValue: string;
  queryKey: string[];
  rpcProcedure:
    | "get_user_chats"
    | "get_bucket_courses"
    | "get_courses_files"
    | "get_user_documents";
  rpcParams: Record<string, any>;
  ilikeProcedure:
    | "ilike_user_chats"
    | "ilike_bucket_courses"
    | "ilike_courses_files"
    | "ilike_user_documents";
  ilikeParams: Record<string, any>;
  selectedItems: T[];
  onToggleItem: (item: T) => void;
  disabledMessage?: string;
  enabled?: boolean;
  maxItems?: number;
}

export const FilterableList = memo(
  <T extends ListItem>({
    open,
    inputValue,
    queryKey,
    rpcProcedure,
    rpcParams,
    ilikeProcedure,
    ilikeParams,
    selectedItems,
    onToggleItem,
    disabledMessage,
    enabled = true,
    maxItems = 5,
  }: FilterableListProps<T>) => {
    const [ilikeItems, setIlikeItems] = useState<T[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number>(-1);
    const listRef = useRef<HTMLDivElement>(null);

    const {
      data: items,
      isPending,
      error,
      inViewRef,
      hasNextPage,
      isFetchingNextPage,
    } = useInfiniteQueryWithRPC({
      queryKey,
      procedure: rpcProcedure,
      params: rpcParams,
      enabled: open && enabled,
    });

    const itemsToDisplay = inputValue.trim().length > 1 ? ilikeItems : items;

    useEffect(() => {
      setSelectedIndex(-1);
    }, [inputValue]);

    useEffect(() => {
      const delayDebounce = setTimeout(() => {
        if (inputValue.trim().length > 1) {
          fetchItems(inputValue);
        }
      }, 250);

      return () => clearTimeout(delayDebounce);
    }, [inputValue, ...Object.values(ilikeParams)]);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent<Document>) => {
        if (!open || !itemsToDisplay?.length) return;

        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            setSelectedIndex((prev) =>
              prev < itemsToDisplay.length - 1 ? prev + 1 : prev,
            );
            break;
          case "ArrowUp":
            e.preventDefault();
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
            break;
          case "Enter":
            e.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < itemsToDisplay.length) {
              const item = itemsToDisplay[selectedIndex];
              toggleItem(item as T);
            }
            break;
        }
      };

      window.addEventListener("keydown", handleKeyDown as any);
      return () => window.removeEventListener("keydown", handleKeyDown as any);
    }, [open, itemsToDisplay, selectedIndex]);

    useEffect(() => {
      if (selectedIndex >= 0 && listRef.current) {
        const selectedElement = listRef.current.children[
          selectedIndex
        ] as HTMLElement;
        if (selectedElement) {
          selectedElement.scrollIntoView({ block: "nearest" });
        }
      }
    }, [selectedIndex]);

    const toggleItem = (item: T) => {
      const itemIncluded = selectedItems.map((i) => i.id).includes(item.id);

      if (!itemIncluded && selectedItems.length >= maxItems) {
        toast.error(`You can only select up to ${maxItems} items`);
        return;
      }

      onToggleItem(item);
    };

    const fetchItems = async (prefix: string) => {
      if (!enabled) {
        return;
      }

      const supabase = createClient();

      const { data, error } = await supabase.rpc(ilikeProcedure, {
        ...ilikeParams,
        prefix,
      });

      if (error || !data) {
        toast.error(`Could not get ${queryKey[0]}`);
        return;
      }

      setIlikeItems(data as T[]);
    };

    if (disabledMessage && !enabled) {
      return (
        <div className="max-h-80 space-y-1 overflow-y-auto pr-1">
          <p className="text-muted-foreground py-8 text-center text-sm">
            {disabledMessage}
          </p>
        </div>
      );
    }

    if (isPending) {
      return (
        <div className="max-h-80 space-y-1 overflow-y-auto pr-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton
              key={index}
              className="bg-muted/50 flex h-8 justify-between rounded-lg border p-2"
            />
          ))}
        </div>
      );
    }

    if (error || !items) {
      return (
        <div className="max-h-80 space-y-1 overflow-y-auto pr-1">
          <p className="text-muted-foreground py-8 text-center text-sm">
            Error loading {queryKey[0]}
          </p>
        </div>
      );
    }

    return (
      <div className="h-56 space-y-1 overflow-y-auto pr-1" ref={listRef}>
        {itemsToDisplay.map((item, index) => (
          <div
            key={item.id}
            className={`hover:bg-muted/50 flex cursor-pointer items-center justify-between rounded-lg border p-2 transition-colors ${
              index === selectedIndex ? "bg-muted" : ""
            }`}
            onClick={() => {
              toggleItem(item as T);
            }}
          >
            <h3 className="font-medium">
              {"name" in item ? item.name : item.title}
            </h3>
            {selectedItems.map((i) => i.id).includes(item.id) && (
              <Check className="size-4 text-green-500" />
            )}
          </div>
        ))}
        {itemsToDisplay.length === 0 && (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No results found
          </p>
        )}
        {hasNextPage && (
          <div ref={inViewRef} className="flex h-8 items-center justify-center">
            {isFetchingNextPage && <Loader2 className="size-4 animate-spin" />}
          </div>
        )}
      </div>
    );
  },
);
