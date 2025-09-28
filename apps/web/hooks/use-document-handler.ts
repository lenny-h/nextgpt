import { useCodeEditorContent } from "@/contexts/code-editor-content-context";
import { useEditor } from "@/contexts/editor-context";
import { useRefs } from "@/contexts/refs-context";
import { useTextEditorContent } from "@/contexts/text-editor-content-context";
import { createClient } from "@/lib/supabase/client";
import { type ArtifactKind } from "@/types/artifact-kind";
import { resizeEditor } from "@workspace/ui/lib/utils";
import { useCallback } from "react";

export function useDocumentHandler() {
  const { panelRef } = useRefs();
  const [, setEditorMode] = useEditor();
  const { textEditorContent, setTextEditorContent } = useTextEditorContent();
  const { codeEditorContent, setCodeEditorContent } = useCodeEditorContent();

  const retrieveFullDocument = useCallback(async (documentId: string) => {
    const supabase = createClient();

    const { data, error } = await supabase.rpc("get_user_document", {
      p_id: documentId,
    });

    if (error || !data) {
      throw new Error("Could not load document. Please try again later.");
    }

    if (data.length !== 1) {
      throw new Error("Document not found");
    }

    return data[0]!;
  }, []);

  const handleDocumentClick = useCallback(
    async (
      documentId: string,
      documentTitle: string,
      documentKind: ArtifactKind
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
    ]
  );

  return { handleDocumentClick };
}
