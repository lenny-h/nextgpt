"use client";

import { BreadcrumbHeader } from "@/components/custom/breadcrumb-header";
import { DocumentsList } from "@/components/custom/documents-list";
import { useRefs } from "@/contexts/refs-context";
import { CustomDocument } from "@workspace/server/drizzle/schema";
import { Input } from "@workspace/ui/components/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@workspace/ui/components/resizable";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { Loader2, Search, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const EditorHeader = dynamic(() =>
  import("@/components/editors/editor-header").then((mod) => mod.EditorHeader),
);
const EditorWrapper = dynamic(() =>
  import("@/components/editors/editor-wrapper").then(
    (mod) => mod.EditorWrapper,
  ),
);

export default function DocumentsPage() {
  const { panelRef } = useRefs();
  const { sharedT } = useSharedTranslations();

  const [documents, setDocuments] = useState<Omit<CustomDocument, "userId">[]>(
    [],
  );
  const [size, setSize] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchDocuments = async (prefix: string) => {
    setIsLoading(true);

    try {
      const documentsData = await apiFetcher(
        (client) =>
          client["documents"]["ilike"].$get({
            query: { prefix },
          }),
        sharedT.apiCodes,
      );

      const documents = documentsData.map((doc) => ({
        ...doc,
        createdAt: new Date(doc.createdAt),
      }));

      setDocuments(documents);
    } catch (error) {
      toast.error("Failed to fetch documents");
    } finally {
      setIsLoading(false);
    }
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
        <div className="flex flex-col items-center space-y-6 overflow-y-auto p-2">
          <h1 className="text-2xl font-semibold">Documents</h1>
          <div className="relative w-full max-w-md">
            <Search
              className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 transform"
              size={14}
            />
            <Input
              className="px-10 py-2"
              placeholder="Search documents..."
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {isLoading ? (
              <Loader2 className="text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 transform animate-spin" />
            ) : searchTerm.length > 0 ? (
              <X
                className="text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 transform cursor-pointer"
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
        className="flex h-[calc(100svh-(--spacing(4)))] flex-col"
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
