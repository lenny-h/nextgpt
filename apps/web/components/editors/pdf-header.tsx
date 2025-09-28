"use client";

import { usePdf } from "@/contexts/pdf-context";
import { useRefs } from "@/contexts/refs-context";
import { Button } from "@workspace/ui/components/button";
import { X } from "lucide-react";
import { ModeSwitcher } from "../editors/mode-switcher";
import { LoadButton } from "./load-button";

export const PdfHeader = () => {
  const { currentPage, currentFileName } = usePdf();
  const { panelRef } = useRefs();

  return (
    <div className="bg-sidebar flex h-14 items-center gap-2 border-b px-3">
      <Button variant="ghost" onClick={() => panelRef.current?.collapse()}>
        <X />
      </Button>

      <div className="flex flex-1 items-center gap-2 truncate text-left text-lg font-semibold">
        <span>{currentFileName || "PDF Document"}</span>
        {currentPage && (
          <span className="text-muted-foreground text-sm font-normal">
            (Page {currentPage})
          </span>
        )}
      </div>

      <ModeSwitcher />

      <LoadButton type="files" />
    </div>
  );
};
