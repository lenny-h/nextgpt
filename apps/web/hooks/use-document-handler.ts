import { useDiff } from "@/contexts/diff-context";
import { createDiffViewString } from "@/lib/utils";
import { type ArtifactKind } from "@workspace/api-routes/types/artifact-kind";
import { useEditor } from "@workspace/ui/contexts/editor-context";
import { useRefs } from "@workspace/ui/contexts/refs-context";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { diffLines } from "@workspace/ui/editors/jsdiff/line";
import { type EditorContent } from "@workspace/ui/editors/text-editor";
import { updateCodeEditorWithDispatch } from "@workspace/ui/editors/utils";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { resizeEditor } from "@workspace/ui/lib/utils";
import { toast } from "sonner";
import { useLocalStorage } from "usehooks-ts";

export function useDocumentHandler() {
  const { sharedT } = useSharedTranslations();

  const { panelRef, textEditorRef, codeEditorRef } = useRefs();
  const { textDiffPrev, setTextDiffNext, codeDiffPrev, setCodeDiffNext } =
    useDiff();

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

  const handleDocumentClick = (
    documentId: string,
    documentTitle: string,
    documentKind: ArtifactKind,
  ) => {
    toast.promise(
      (async () => {
        const fullDocument = await apiFetcher(
          (client) =>
            client["documents"][":documentId"].$get({
              param: { documentId },
            }),
          sharedT.apiCodes,
        );

        setEditorMode(documentKind);

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
      })(),
      {
        loading: "Loading document...",
        success: "Document loaded successfully",
        error: (error) => "Error loading document: " + error,
      },
    );
  };

  const handleDocumentToolCallClick = (
    documentId: string,
    fetchDocument: boolean,
  ) => {
    toast.promise(
      (async () => {
        const { toolCallDocument, existingDocument } = await apiFetcher(
          (client) =>
            client["tool-call-documents"][":documentId"].$get({
              param: {
                documentId,
                fetchDocument: fetchDocument ? "true" : "false",
              },
            }),
          sharedT.apiCodes,
        );

        setEditorMode(toolCallDocument.kind);

        if (toolCallDocument.kind === "text") {
          setLocalTextEditorContent({
            id: documentId,
            title: toolCallDocument.title,
            content: toolCallDocument.content,
          });

          // Dynamically load the text editor update helper only when needed
          const { updateTextEditorWithDispatch } = await import(
            "@workspace/ui/editors/text-editor"
          );
          updateTextEditorWithDispatch(textEditorRef, toolCallDocument.content);

          if (textEditorRef.current && existingDocument) {
            textDiffPrev.current = textEditorRef.current.state;
            setTextDiffNext(toolCallDocument.content);
            const diffResult = diffLines(
              toolCallDocument.content,
              existingDocument.content,
            );

            // Disable editing for the diff view
            textEditorRef.current.setProps({ editable: () => false });

            updateTextEditorWithDispatch(
              textEditorRef,
              createDiffViewString(diffResult, true),
            );
          }
        } else {
          setLocalCodeEditorContent({
            id: documentId,
            title: toolCallDocument.title,
            content: toolCallDocument.content,
          });

          updateCodeEditorWithDispatch(codeEditorRef, toolCallDocument.content);

          if (codeEditorRef.current && existingDocument) {
            // Dynamically Import StateEffect, EditorView
            const { StateEffect } = await import("@codemirror/state");
            const { EditorView } = await import("@codemirror/view");

            codeDiffPrev.current = codeEditorRef.current.state;
            setCodeDiffNext(toolCallDocument.content);
            const diffResult = diffLines(
              toolCallDocument.content,
              existingDocument.content,
            );

            // Create a transaction that reconfigures the editable facet to false
            // This disables editing for the diff view
            const effect = StateEffect.reconfigure.of([
              EditorView.editable.of(false),
            ]);
            codeEditorRef.current.dispatch({ effects: effect });

            updateCodeEditorWithDispatch(
              codeEditorRef,
              createDiffViewString(diffResult, true),
            );
          }
        }

        resizeEditor(panelRef, false);
      })(),
      {
        loading: "Loading document...",
        success: "Document loaded successfully",
        error: (error) => "Error loading document: " + error,
      },
    );
  };

  return { handleDocumentClick, handleDocumentToolCallClick };
}
