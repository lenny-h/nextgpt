import { useCodeEditorContent } from "@/contexts/code-editor-content-context";
import { useEditor } from "@/contexts/editor-context";
import { useRefs } from "@/contexts/refs-context";
import { useTextEditorContent } from "@/contexts/text-editor-content-context";
import { buildDocumentFromContent } from "@workspace/ui/editors/functions";
import { useCallback } from "react";

export function useDiffActions() {
  const { textEditorRef, codeEditorRef } = useRefs();
  const [editorMode] = useEditor();

  const {
    diffPrev: textDiffPrev,
    setDiffPrevString,
    diffNext: textDiffNext,
    setDiffNext: setTextDiffNext,
  } = useTextEditorContent();

  const {
    diffPrev: codeDiffPrev,
    diffNext: codeDiffNext,
    setDiffNext: setCodeDiffNext,
  } = useCodeEditorContent();

  const isDiff = editorMode === "text" ? textDiffNext : codeDiffNext;

  const handleTextDiffAction = useCallback(
    (acceptChanges: boolean) => {
      if (!textEditorRef.current || !textDiffPrev.current) return;

      if (acceptChanges) {
        const newDoc = buildDocumentFromContent(textDiffNext);

        const tr = textDiffPrev.current.tr;
        tr.replaceWith(
          0,
          textDiffPrev.current.doc.content.size,
          newDoc.content
        );

        const newState = textDiffPrev.current.apply(tr);
        if (newState) {
          textEditorRef.current.updateState(newState);
        }
      } else {
        textEditorRef.current.updateState(textDiffPrev.current);
      }

      textDiffPrev.current = undefined;
      setDiffPrevString("");
      setTextDiffNext("");
    },
    [textEditorRef, textDiffPrev, textDiffNext, setTextDiffNext]
  );

  const handleCodeDiffAction = useCallback(
    (acceptChanges: boolean) => {
      if (!codeEditorRef.current || !codeDiffPrev.current) return;

      if (acceptChanges) {
        codeEditorRef.current.setState(codeDiffPrev.current);

        const transaction = codeDiffPrev.current.update({
          changes: {
            from: 0,
            to: codeEditorRef.current.state.doc.length,
            insert: codeDiffNext,
          },
        });

        codeEditorRef.current.dispatch(transaction);
      } else {
        codeEditorRef.current.setState(codeDiffPrev.current);
      }

      codeDiffPrev.current = undefined;
      setCodeDiffNext("");
    },
    [codeEditorRef, codeDiffPrev, codeDiffNext, setCodeDiffNext]
  );

  const handleDiffAction = useCallback(
    (acceptChanges: boolean) => {
      if (editorMode === "text") {
        handleTextDiffAction(acceptChanges);
      } else {
        handleCodeDiffAction(acceptChanges);
      }
    },
    [editorMode, handleTextDiffAction, handleCodeDiffAction]
  );

  return {
    isDiff,
    handleDiffAction,
  };
}
