"use client";

import { DocumentsList } from "@/components/custom/documents-list";
import { Header } from "@/components/custom/toggle-sidebars-header";
import { type Document } from "@/types/document";
import { Input } from "@workspace/ui/components/input";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { Loader2, Search, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function DocumentsPage() {
  const { sharedT } = useSharedTranslations();

  const [documents, setDocuments] = useState<Document[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchDocuments = async (prefix: string) => {
    setIsLoading(true);

    const documentsData = await apiFetcher(
      (client) =>
        client.documents.ilike.$get({
          query: { prefix },
        }),
      sharedT.apiCodes,
    );

    const documents = documentsData.items.map((doc) => ({
      ...doc,
      createdAt: new Date(doc.createdAt),
    }));

    setIsLoading(false);

    setDocuments(documents);
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
    <div className="flex h-dvh flex-col">
      <Header showCourseSelector={false} />
      <div className="flex flex-1 flex-col items-center space-y-4 overflow-y-auto px-3 pb-3 pt-8 md:space-y-6">
        <h1 className="text-2xl font-semibold">Documents</h1>
        <div className="relative w-full max-w-xl">
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
        <DocumentsList documents={documents} isSearching={!!searchTerm} />
      </div>
    </div>
  );
}
