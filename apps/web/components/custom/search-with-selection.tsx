"use client";

import { useFilter } from "@/contexts/filter-context";
import { Badge } from "@workspace/ui/components/badge";
import { Input } from "@workspace/ui/components/input";
import { Search, X } from "lucide-react";

interface SearchWithSelectionProps {
  type: "chats" | "courses" | "files" | "documents";
  inputValue: string;
  onInputChange: (value: string) => void;
  showCurrentSelection?: boolean;
}

export function SearchWithSelection({
  type,
  inputValue,
  onInputChange,
  showCurrentSelection = true,
}: SearchWithSelectionProps) {
  const { filter, setFilter } = useFilter();

  const currentSelection =
    (type === "courses"
      ? filter.courses
      : type === "files"
        ? filter.files
        : filter.documents) || [];

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="text-muted-foreground absolute left-2.5 top-2.5 size-4" />
        <Input
          placeholder={`Search for ${type}...`}
          className="pl-8"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
        />
      </div>

      {showCurrentSelection && (
        <div className="min-h-18 flex h-fit w-full flex-wrap gap-2 rounded-lg border p-2">
          {currentSelection.map((i) => (
            <Badge key={i.id} className="h-6">
              {"name" in i ? i.name : i.title}
              <button
                className="text-muted-foreground hover:text-destructive ml-2 cursor-pointer"
                onClick={() =>
                  setFilter({
                    ...filter,
                    [type]: currentSelection.filter((item) => item.id !== i.id),
                  })
                }
              >
                <X size={12} />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
