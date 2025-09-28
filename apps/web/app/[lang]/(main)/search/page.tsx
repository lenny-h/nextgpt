"use client";

import { SourcesList } from "@/components/custom/sources-list";
import { Header } from "@/components/custom/toggle-sidebars-header";
import { useCSResults } from "@/contexts/classic-search-results";
import { useFilter } from "@/contexts/filter-context";
import { useGlobalTranslations } from "@/contexts/global-translations";
import { useVSResults } from "@/contexts/semantic-search-results";
import { type DocumentSource } from "@/types/document-source";
import { Input } from "@workspace/ui/components/input";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { checkResponse } from "@workspace/ui/lib/translation-utils";
import { Loader2, Search, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SearchPage() {
  const { globalT } = useGlobalTranslations();

  const { filter } = useFilter();
  const [csResults, setCsResults] = useCSResults();
  const [vsResults, setVsResults] = useVSResults();

  const [searchMode, setSearchMode] = useState<"keywords" | "semantic">(
    "keywords",
  );
  const [classicQuery, setClassicQuery] = useState("");
  const [semanticQuery, setSemanticQuery] = useState("");

  const searchTerm = searchMode === "keywords" ? classicQuery : semanticQuery;
  const sources = searchMode === "keywords" ? csResults : vsResults;

  const [isLoading, setIsLoading] = useState(false);

  const setSearchTerm = (term: string) => {
    if (searchMode === "keywords") {
      setClassicQuery(term);
    } else {
      setSemanticQuery(term);
    }
  };

  const setSources = (sources: DocumentSource[]) => {
    if (searchMode === "keywords") {
      setCsResults(sources);
    } else {
      setVsResults(sources);
    }
  };

  const fetchSources = async (query: string) => {
    if (query.length < 3) {
      return;
    }

    if (filter.courses.length === 0) {
      toast.error("Please select at least one course");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/capi/protected/search/${encodeURI(query)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            filter: {
              ...filter,
              courses: filter.courses.map((course) => course.id),
            },
            fts: searchMode === "keywords",
          }),
        },
      );

      checkResponse(response, globalT.globalErrors);

      const { sources }: { sources: Array<DocumentSource> } =
        await response.json();

      setSources(sources);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : globalT.globalErrors.error,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      fetchSources(searchTerm);
    }
  };

  return (
    <div className="flex h-dvh flex-col">
      <Header showCourseSelector={true} />
      <div className="flex flex-1 flex-col items-center space-y-4 overflow-y-auto px-3 pb-3 pt-8 md:space-y-6">
        <h1 className="text-2xl font-semibold">Search</h1>
        <div className="flex w-full max-w-xl flex-col items-center gap-2 md:max-w-2xl md:flex-row-reverse">
          <Tabs
            defaultValue={searchMode}
            onValueChange={(value) =>
              setSearchMode(value as "keywords" | "semantic")
            }
          >
            <TabsList className="grid w-[170px] grid-cols-2">
              <TabsTrigger value="keywords" className="cursor-pointer">
                Keywords
              </TabsTrigger>
              <TabsTrigger value="semantic" className="cursor-pointer">
                Semantic
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative w-full md:flex-1">
            <Search
              className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 transform"
              size={14}
            />
            <Input
              className="px-10 py-2"
              placeholder="Search sources..."
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              value={searchTerm}
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
        </div>
        <SourcesList sources={sources} isLoading={isLoading} />
      </div>
    </div>
  );
}
