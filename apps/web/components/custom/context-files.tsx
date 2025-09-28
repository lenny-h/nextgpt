"use client";

import { useFilter } from "@/contexts/filter-context";
import { Badge } from "@workspace/ui/components/badge";
import { X } from "lucide-react";
import { memo } from "react";
import { AddContext } from "./add-context";

export const ContextFiles = memo(() => {
  const { filter, setFilter } = useFilter();

  if (!filter.bucketId) {
    return null;
  }

  const files = filter.files || [];
  const documents = filter.documents || [];

  return (
    <div className="scrollbar-hidden mx-3 flex flex-row gap-2 overflow-x-scroll border-b py-1">
      <AddContext type="files" />
      {files.map((file) => (
        <Badge key={file.id} variant="default">
          {file.name}
          <button
            className="text-muted-foreground hover:text-destructive ml-2 cursor-pointer"
            onClick={() =>
              setFilter((prev) => ({
                ...prev,
                files: prev.files?.filter((f) => f.id !== file.id),
              }))
            }
          >
            <X size={12} />
          </button>
        </Badge>
      ))}

      <AddContext type="documents" />
      {documents.map((document) => (
        <Badge key={document.id} variant="default">
          {document.title}
          <button
            className="text-muted-foreground hover:text-destructive ml-2 cursor-pointer"
            onClick={() =>
              setFilter((prev) => ({
                ...prev,
                documents: prev.documents?.filter((d) => d.id !== document.id),
              }))
            }
          >
            <X size={12} />
          </button>
        </Badge>
      ))}
    </div>
  );
});
