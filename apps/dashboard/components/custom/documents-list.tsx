import { useCodeEditorContent } from "@/contexts/code-editor-content-context";
import { useEditor } from "@/contexts/editor-context";
import { useTextEditorContent } from "@/contexts/text-editor-content-context";
import { useInfiniteQueryWithRPC } from "@/hooks/use-infinite-query";
import { CustomDocument } from "@workspace/server/drizzle/schema";
import { Badge } from "@workspace/ui/components/badge";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { cn } from "@workspace/ui/lib/utils";
import { File, Loader2 } from "lucide-react";
import { type ImperativePanelHandle } from "react-resizable-panels";
import { toast } from "sonner";

interface Props {
  documents: CustomDocument[];
  isSearching: boolean;
  panelRef: React.RefObject<ImperativePanelHandle | null>;
  size: number;
}

export const DocumentsList = ({
  documents: ilikeDocuments,
  isSearching,
  panelRef,
  size,
}: Props) => {
  const { sharedT } = useSharedTranslations();

  const [, setEditorMode] = useEditor();
  const { setTextEditorContent } = useTextEditorContent();
  const { setCodeEditorContent } = useCodeEditorContent();

  const {
    data: documents,
    isPending,
    error,
    inViewRef,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQueryWithRPC({
    queryKey: ["documents"],
    procedure: "get_user_documents",
  });

  const documentsToDisplay = isSearching ? ilikeDocuments : documents;

  const onClickDocument = async (
    documentId: string,
    documentTitle: string,
    documentKind: "text" | "code",
  ) => {
    const fullDocument = await apiFetcher(
      (client) =>
        client.documents[":documentId"].$get({
          param: { documentId },
        }),
      sharedT.apiCodes,
    );

    setEditorMode(documentKind);

    if (documentKind === "text") {
      setTextEditorContent({
        id: documentId,
        title: documentTitle,
        content: fullDocument.content,
      });
    } else {
      setCodeEditorContent({
        id: documentId,
        title: documentTitle,
        content: fullDocument.content,
      });
    }

    if (panelRef.current?.isCollapsed()) {
      panelRef.current?.resize(55);
    }
  };

  if (isPending) {
    return (
      <div className="grid h-4/5 w-full max-w-4xl grid-cols-1 gap-2 overflow-y-auto md:grid-cols-2 xl:grid-cols-3">
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
        "grid h-4/5 w-full max-w-4xl grid-cols-1 gap-2 overflow-y-auto",
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
              onClickDocument(
                document.id,
                document.title,
                document.kind as "text" | "code",
              ),
              {
                loading: "Loading document...",
                success: "Document loaded successfully",
                error: (error) => "Error loading document: " + error,
              },
            );
          }}
        >
          <File className="text-primary h-full w-10" />
          <div className="flex flex-1 flex-col space-y-1 overflow-x-hidden">
            <div className="flex w-full items-center space-x-2">
              <h2 className="truncate text-lg font-semibold">
                {document.title}
              </h2>
              <Badge variant="outline">{document.kind}</Badge>
            </div>
            <p className="text-muted-foreground w-full truncate text-start text-sm">
              {new Date(document.createdAt).toLocaleString()}
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
