"use client";

import { useCodeEditorContent } from "@/contexts/code-editor-content-context";
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

type EditorProps = {
  codeEditorRef: React.RefObject<EditorView | null>;
};

export const CodeEditor = memo(({ codeEditorRef: editorRef }: EditorProps) => {
  const { codeEditorContent, setCodeEditorContent, diffPrev, diffNext } =
    useCodeEditorContent();

  const containerRef = useRef<HTMLDivElement>(null);

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    "code-editor-input",
    "",
  );

  useEffect(() => {
    console.log("Initializing code editor");

    if (containerRef.current && !editorRef.current) {
      const startState = EditorState.create({
        doc: codeEditorContent.content,
        extensions: [
          basicSetup,
          python(),
          javascript(),
          java(),
          cpp(),
          oneDark,
          EditorView.editable.of(!diffPrev.current),
        ],
      });

      editorRef.current = new EditorView({
        state: startState,
        parent: containerRef.current,
      });
    }

    if (!codeEditorContent.content) {
      setCodeEditorContent((prev) => ({
        ...prev,
        content: localStorageInput,
      }));
    }

    return () => {
      if (editorRef.current) {
        const content = editorRef.current.state.doc.toString();

        setCodeEditorContent((prev) => ({
          ...prev,
          content,
        }));

        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      const newState = EditorState.create({
        doc: codeEditorContent.content,
        extensions: [
          basicSetup,
          python(),
          javascript(),
          java(),
          cpp(),
          oneDark,
          EditorView.editable.of(!diffPrev.current || !diffNext),
        ],
      });

      editorRef.current.setState(newState);
    }
  }, [codeEditorContent.content]);

  useEffect(() => {
    if (!editorRef.current) return;

    const saveInterval = setInterval(() => {
      if (editorRef.current) {
        setLocalStorageInput(editorRef.current.state.doc.toString());
      }
    }, 17000);

    return () => {
      clearInterval(saveInterval);
    };
  }, [editorRef.current, setLocalStorageInput]);

  return (
    <div className="not-prose relative size-full text-sm" ref={containerRef} />
  );
});
