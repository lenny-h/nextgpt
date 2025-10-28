import { useDiff } from "@/contexts/diff-context";
import { useEditor } from "@workspace/ui/contexts/editor-context";
import { useRefs } from "@workspace/ui/contexts/refs-context";
import { buildDocumentFromContent } from "@workspace/ui/editors/functions";
import { useCallback } from "react";

export function useDiffActions() {
  const { textEditorRef, codeEditorRef } = useRefs();
  const [editorMode] = useEditor();

  const {
    textDiffPrev,
    textDiffNext,
    setTextDiffNext,
    codeDiffPrev,
    codeDiffNext,
    setCodeDiffNext,
  } = useDiff();

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
          newDoc.content,
        );

        const newState = textDiffPrev.current.apply(tr);
        if (newState) {
          textEditorRef.current.updateState(newState);
          textEditorRef.current.setProps({ editable: () => true });
        }
      } else {
        textEditorRef.current.updateState(textDiffPrev.current);
      }

      textDiffPrev.current = undefined;
      setTextDiffNext("");
    },
    [textEditorRef, textDiffPrev, textDiffNext, setTextDiffNext],
  );

  const handleCodeDiffAction = useCallback(
    (acceptChanges: boolean) => {
      if (!codeEditorRef.current || !codeDiffPrev.current) return;

      if (acceptChanges) {
        const prevState = codeDiffPrev.current;

        const transaction = prevState.update({
          changes: {
            from: 0,
            to: codeEditorRef.current.state.doc.length,
            insert: codeDiffNext,
          },
        });

        codeEditorRef.current.setState(codeDiffPrev.current);
        codeEditorRef.current.dispatch(transaction);
      } else {
        codeEditorRef.current.setState(codeDiffPrev.current);
      }

      codeDiffPrev.current = undefined;
      setCodeDiffNext("");
    },
    [codeEditorRef, codeDiffPrev, codeDiffNext, setCodeDiffNext],
  );

  const handleDiffAction = useCallback(
    (acceptChanges: boolean) => {
      if (editorMode === "text") {
        handleTextDiffAction(acceptChanges);
      } else {
        handleCodeDiffAction(acceptChanges);
      }
    },
    [editorMode, handleTextDiffAction, handleCodeDiffAction],
  );

  return {
    isDiff,
    handleDiffAction,
  };
}
