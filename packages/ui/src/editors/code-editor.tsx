"use client";

import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { EditorState } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { memo, useEffect, useRef } from "react";
import { useLocalStorage } from "usehooks-ts";
import { type EditorContent } from "./text-editor";

type EditorProps = {
  codeEditorRef: React.RefObject<EditorView | null>;
};

export const CodeEditor = memo(({ codeEditorRef: editorRef }: EditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [localStorageInput, setLocalStorageInput] =
    useLocalStorage<EditorContent>("code-editor-input", {
      id: undefined,
      title: "",
      content: "",
    });

  useEffect(() => {
    console.log("Initializing code editor");

    if (containerRef.current && !editorRef.current) {
      const startState = EditorState.create({
        doc: localStorageInput.content,
        extensions: [
          basicSetup,
          python(),
          javascript(),
          java(),
          cpp(),
          oneDark,
        ],
      });

      editorRef.current = new EditorView({
        state: startState,
        parent: containerRef.current,
      });
    }

    return () => {
      if (editorRef.current) {
        syncCodeEditorContentToLocalStorage(editorRef, setLocalStorageInput);

        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  return (
    <div className="not-prose relative size-full text-sm" ref={containerRef} />
  );
});

export function syncCodeEditorContentToLocalStorage(
  editorRef: React.RefObject<EditorView | null>,
  setLocalStorageInput: React.Dispatch<React.SetStateAction<EditorContent>>
) {
  if (!editorRef.current) return;

  const content = editorRef.current.state.doc.toString();

  setLocalStorageInput((prev) => ({
    ...prev,
    content,
  }));
}

// export function updateCodeEditorWithNewState(
//   editorRef: React.RefObject<EditorView | null>,
//   content: string,
//   editable: boolean,
// ) {
//   if (!editorRef.current) return;

//   const newState = EditorState.create({
//     doc: content,
//     extensions: [
//       basicSetup,
//       python(),
//       javascript(),
//       java(),
//       cpp(),
//       oneDark,
//       EditorView.editable.of(editable),
//     ],
//   });

//   editorRef.current.setState(newState);
// }
