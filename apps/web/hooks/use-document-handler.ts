import { type ArtifactKind } from "@workspace/api-routes/types/artifact-kind";
import { useEditor } from "@workspace/ui/contexts/editor-context";
import { useRefs } from "@workspace/ui/contexts/refs-context";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { type EditorContent } from "@workspace/ui/editors/text-editor";
import { updateCodeEditorWithDispatch } from "@workspace/ui/editors/utils";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { resizeEditor } from "@workspace/ui/lib/utils";
import { useLocalStorage } from "usehooks-ts";

export function useDocumentHandler() {
  const { sharedT } = useSharedTranslations();

  const { panelRef, textEditorRef, codeEditorRef } = useRefs();

  const [, setEditorMode] = useEditor();

  const [, setLocalTextEditorContent] = useLocalStorage<EditorContent>(
    "text-editor-input",
    {
      id: undefined,
      title: "",
      content: "",
    },
  );
  const [, setLocalCodeEditorContent] = useLocalStorage<EditorContent>(
    "text-editor-input",
    {
      id: undefined,
      title: "",
      content: "",
    },
  );

  const handleDocumentClick = async (
    documentId: string,
    documentTitle: string,
    documentKind: ArtifactKind,
  ) => {
    setEditorMode(documentKind);

    const fullDocument = await apiFetcher(
      (client) =>
        client["documents"][":documentId"].$get({
          param: { documentId },
        }),
      sharedT.apiCodes,
    );

    if (documentKind === "text") {
      setLocalTextEditorContent({
        id: documentId,
        title: documentTitle,
        content: fullDocument.content,
      });

      // Dynamically load the text editor update helper only when needed
      const { updateTextEditorWithDispatch } = await import(
        "@workspace/ui/editors/text-editor"
      );
      updateTextEditorWithDispatch(textEditorRef, fullDocument.content);
    } else {
      setLocalCodeEditorContent({
        id: documentId,
        title: documentTitle,
        content: fullDocument.content,
      });

      updateCodeEditorWithDispatch(codeEditorRef, fullDocument.content);
    }

    resizeEditor(panelRef, false);
  };

  return { handleDocumentClick };
}
