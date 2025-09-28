"use client";

import { useEditor } from "@/contexts/editor-context";
import { useRefs } from "@/contexts/refs-context";
import { CodeEditor } from "./code-editor";
import { TextEditor } from "./text-editor";

// const TextEditor = dynamic(() =>
//   import("./text-editor").then((mod) => mod.TextEditor)
// );
// const CodeEditor = dynamic(() =>
//   import("./code-editor").then((mod) => mod.CodeEditor)
// );

export const EditorWrapper = () => {
  const { textEditorRef, codeEditorRef } = useRefs();
  const [editorMode] = useEditor();

  if (editorMode === "text") {
    return (
      <div className="w-full flex-1 overflow-y-auto px-4">
        <TextEditor textEditorRef={textEditorRef} />
      </div>
    );
  }

  return (
    <div className="bg-code w-full flex-1 overflow-y-auto">
      <CodeEditor codeEditorRef={codeEditorRef} />
    </div>
  );
};
