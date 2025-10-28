import { type EditorView } from "@codemirror/view";

export function updateCodeEditorWithDispatch(
  editorRef: React.RefObject<EditorView | null>,
  newContent: string,
) {
  if (!editorRef.current) return;

  editorRef.current.dispatch({
    changes: {
      from: 0,
      to: editorRef.current.state.doc.length,
      insert: newContent,
    },
  });
}

export function appendContentToCodeEditor(
  editorRef: React.RefObject<EditorView | null>,
  contentToAppend: string,
) {
  if (!editorRef.current) return;

  editorRef.current.dispatch({
    changes: {
      from: editorRef.current.state.doc.length,
      to: editorRef.current.state.doc.length,
      insert: contentToAppend,
    },
  });
}
