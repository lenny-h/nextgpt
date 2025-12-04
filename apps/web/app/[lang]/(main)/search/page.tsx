"use client";

import { SourcesList } from "@/components/custom/sources-list";
import { Header } from "@/components/custom/toggle-sidebars-header";
import { useCSResults } from "@/contexts/classic-search-results";
import { useFilter } from "@/contexts/filter-context";
import { useVSResults } from "@/contexts/semantic-search-results";
import { useWebTranslations } from "@/contexts/web-translations";
import { stripFilter } from "@/lib/utils";
import { type DocumentSource } from "@workspace/api-routes/types/document-source";
import { Input } from "@workspace/ui/components/input";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { Loader2, Search, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SearchPage() {
  const { sharedT } = useSharedTranslations();
  const { webT } = useWebTranslations();

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
      toast.error(webT.searchPage.selectAtLeastOneCourse);
      return;
    }

    setIsLoading(true);

    try {
      const docSources = await apiFetcher(
        (client) =>
          client.search[":query"].$post({
            param: { query: encodeURI(query) },
            json: {
              filter: stripFilter(filter, false),
              fts: searchMode === "keywords",
            },
          }),
        sharedT.apiCodes,
      );

      setSources(docSources);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : sharedT.apiCodes.FALLBACK_ERROR,
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
      <div className="flex flex-1 flex-col items-center space-y-4 overflow-y-auto px-3 pt-8 pb-3 md:space-y-6">
        <h1 className="text-2xl font-semibold">{webT.searchPage.title}</h1>
        <div className="flex w-full max-w-xl flex-col items-center gap-2 md:max-w-2xl md:flex-row-reverse">
          <Tabs
            defaultValue={searchMode}
            onValueChange={(value) =>
              setSearchMode(value as "keywords" | "semantic")
            }
          >
            <TabsList className="grid w-[170px] grid-cols-2">
              <TabsTrigger value="keywords" className="cursor-pointer">
                {webT.searchPage.keywords}
              </TabsTrigger>
              <TabsTrigger value="semantic" className="cursor-pointer">
                {webT.searchPage.semantic}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative w-full md:flex-1">
            <Search
              className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 transform"
              size={14}
            />
            <Input
              className="px-10 py-2"
              placeholder={webT.searchPage.searchPlaceholder}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              value={searchTerm}
            />
            {isLoading ? (
              <Loader2 className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 transform animate-spin" />
            ) : searchTerm.length > 0 ? (
              <X
                className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 transform cursor-pointer"
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
