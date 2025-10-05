import { useCodeEditorContent } from "@/contexts/code-editor-content-context";
import { useEditor } from "@/contexts/editor-context";
import { useRefs } from "@/contexts/refs-context";
import { useTextEditorContent } from "@/contexts/text-editor-content-context";
import { type ArtifactKind } from "@workspace/api-routes/types/artifact-kind";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { resizeEditor } from "@workspace/ui/lib/utils";
import { useCallback } from "react";

export function useDocumentHandler() {
  const { sharedT } = useSharedTranslations();

  const { panelRef } = useRefs();
  const [, setEditorMode] = useEditor();
  const { textEditorContent, setTextEditorContent } = useTextEditorContent();
  const { codeEditorContent, setCodeEditorContent } = useCodeEditorContent();

  const retrieveFullDocument = useCallback(async (documentId: string) => {
    const data = await apiFetcher(
      (client) =>
        client["documents"][":documentId"].$get({
          param: { documentId },
        }),
      sharedT.apiCodes,
    );

    return data.item;
  }, []);

  const handleDocumentClick = useCallback(
    async (
      documentId: string,
      documentTitle: string,
      documentKind: ArtifactKind,
    ) => {
      setEditorMode(documentKind);
      resizeEditor(panelRef, false);

      if (documentKind === "text" && textEditorContent.id === documentId) {
        return;
      } else if (
        documentKind === "code" &&
        codeEditorContent.id === documentId
      ) {
        return;
      }

      const fullDocument = await retrieveFullDocument(documentId);

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
    },
    [
      panelRef,
      setEditorMode,
      textEditorContent.id,
      codeEditorContent.id,
      setTextEditorContent,
      setCodeEditorContent,
      retrieveFullDocument,
    ],
  );

  return { handleDocumentClick };
}
