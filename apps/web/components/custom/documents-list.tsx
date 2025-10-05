import { useRefs } from "@/contexts/refs-context";
import { useDocumentHandler } from "@/hooks/use-document-handler";
import { type ArtifactKind } from "@/types/artifact-kind";
import { type Document } from "@/types/document";
import { Badge } from "@workspace/ui/components/badge";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { useInfiniteQueryWithRPC } from "@workspace/ui/hooks/use-infinite-query";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { cn } from "@workspace/ui/lib/utils";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  documents: Document[];
  isSearching: boolean;
}

export const DocumentsList = ({
  documents: ilikeDocuments,
  isSearching,
}: Props) => {
  const { sharedT } = useSharedTranslations();

  const { panelRef, size } = useRefs();

  const { handleDocumentClick } = useDocumentHandler();

  const {
    data: documentsData,
    isPending,
    error,
    inViewRef,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQueryWithRPC({
    queryKey: ["documents"],
    queryFn: ({ pageParam }) =>
      apiFetcher(
        (client) =>
          client.documents.$get({
            query: {
              pageNumber: (pageParam ?? 0).toString(),
              itemsPerPage: "10",
            },
          }),
        sharedT.apiCodes,
      ),
  });

  const documents = documentsData.items;

  const documentsToDisplay = isSearching ? ilikeDocuments : documents;

  if (isPending) {
    return (
      <div className="grid w-full max-w-4xl grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 10 }).map((_, index) => (
          <div
            key={index}
            className="border-primary/30 flex h-20 w-full items-center space-x-2 rounded-md border p-2"
          >
            <Skeleton className="h-full w-10" />
            <div className="flex flex-1 flex-col items-start space-y-1 overflow-x-hidden">
              <div className="flex w-full items-center space-x-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-5 w-12" />
              </div>
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !documents) {
    return (
      <div className="flex h-3/5 flex-col items-center justify-center space-y-8 p-2">
        <h1 className="text-lg font-semibold">Error loading documents</h1>
      </div>
    );
  }

  if (documentsToDisplay.length === 0) {
    return (
      <p className="text-muted-foreground w-full py-8 text-center text-sm">
        No results found
      </p>
    );
  }

  return (
    <div
      className={cn(
        "grid w-full max-w-4xl grid-cols-1 gap-2",
        panelRef.current?.isCollapsed()
          ? "md:grid-cols-2 xl:grid-cols-3"
          : size < 60
            ? "xl:grid-cols-2"
            : "xl:grid-cols-1",
      )}
    >
      {documentsToDisplay.map((document) => (
        <button
          key={document.id}
          className="border-primary flex h-20 w-full cursor-pointer items-center space-x-2 rounded-md border p-2"
          onClick={async () => {
            toast.promise(
              handleDocumentClick(
                document.id,
                document.title,
                document.kind as ArtifactKind,
              ),
              {
                loading: "Loading document...",
                success: "Document loaded successfully",
                error: (error) => "Error loading document: " + error,
              },
            );
          }}
        >
          <FileText className="text-primary h-full w-10" />
          <div className="flex flex-1 flex-col space-y-1 overflow-x-hidden">
            <div className="flex w-full items-center space-x-2">
              <h2 className="truncate text-lg font-semibold">
                {document.title}
              </h2>
              <Badge variant="outline">{document.kind}</Badge>
            </div>
            <p className="text-muted-foreground w-full truncate text-start text-sm">
              {new Date(document.created_at).toLocaleString()}
            </p>
          </div>
        </button>
      ))}
      {hasNextPage && (
        <div
          ref={inViewRef}
          className={cn(
            "col-span-1 flex h-8 items-center justify-center",
            panelRef.current?.isCollapsed()
              ? "md:col-span-2 xl:col-span-3"
              : size < 60
                ? "xl:col-span-2"
                : "xl:col-span-1",
          )}
        >
          {isFetchingNextPage && <Loader2 className="size-4 animate-spin" />}
        </div>
      )}
    </div>
  );
};
