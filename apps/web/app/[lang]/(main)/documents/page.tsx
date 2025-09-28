"use client";

import { DocumentsList } from "@/components/custom/documents-list";
import { Header } from "@/components/custom/toggle-sidebars-header";
import { createClient } from "@/lib/supabase/client";
import { type Document } from "@/types/document";
import { Input } from "@workspace/ui/components/input";
import { Loader2, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);

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
    <div className="flex flex-col h-dvh">
      <Header showCourseSelector={false} />
      <div className="overflow-y-auto flex-1 px-3 pb-3 pt-8 flex flex-col items-center space-y-4 md:space-y-6">
        <h1 className="text-2xl font-semibold">Documents</h1>
        <div className="relative w-full max-w-xl">
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
        <DocumentsList documents={documents} isSearching={!!searchTerm} />
      </div>
    </div>
  );
}
