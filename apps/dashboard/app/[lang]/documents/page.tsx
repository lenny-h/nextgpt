"use client";

import { BreadcrumbHeader } from "@/components/custom/breadcrumb-header";
import { DocumentsList } from "@/components/custom/documents-list";
import { useRefs } from "@/contexts/refs-context";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@workspace/ui/components/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/resizable";
import { type UserDocument } from "@workspace/ui/types/user-document";
import { Loader2, Search, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const EditorHeader = dynamic(() =>
  import("@/components/editors/editor-header").then((mod) => mod.EditorHeader)
);
const EditorWrapper = dynamic(() =>
  import("@/components/editors/editor-wrapper").then((mod) => mod.EditorWrapper)
);

export default function DocumentsPage() {
  const { panelRef } = useRefs();

  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [size, setSize] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchDocuments = async (prefix: string) => {
    setIsLoading(true);

    const supabase = createClient();

    const { data, error } = await supabase.rpc("ilike_user_documents", {
      prefix,
    });

    setIsLoading(false);

    if (error || !data) {
      toast.error("Failed to fetch documents");
      return;
    }

    setDocuments(data);
  };

  useEffect(() => {
    if (!searchTerm) {
      setDocuments([]);
      return;
    }

    const debounceTimeout = setTimeout(() => {
      fetchDocuments(searchTerm);
    }, 250);

    return () => clearTimeout(debounceTimeout);
  }, [searchTerm]);

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel
        className="h-[calc(100svh-(--spacing(4)))]"
        defaultSize={100}
        collapsible
      >
        <BreadcrumbHeader />
        <div className="overflow-y-auto p-2 flex flex-col space-y-6 items-center">
          <h1 className="text-2xl font-semibold">Documents</h1>
          <div className="relative w-full max-w-md">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              size={14}
            />
            <Input
              className="px-10 py-2"
              placeholder="Search documents..."
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {isLoading ? (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground animate-spin" />
            ) : searchTerm.length > 0 ? (
              <X
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground cursor-pointer"
                size={14}
                onClick={() => setSearchTerm("")}
              />
            ) : null}
          </div>
          <DocumentsList
            documents={documents}
            isSearching={!!searchTerm}
            panelRef={panelRef}
            size={size}
          />
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel
        className="flex flex-col h-[calc(100svh-(--spacing(4)))]"
        ref={panelRef}
        defaultSize={0}
        onResize={(size) => {
          setSize(size);
          if (size < 35) {
            panelRef.current?.collapse?.();
          } else if (size > 70) {
            panelRef.current?.resize(100);
          }
        }}
        collapsible
      >
        <EditorHeader />
        <EditorWrapper />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
