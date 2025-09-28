"use client";

import { EditorState } from "@codemirror/state";
import React, {
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
  useRef,
  useState,
} from "react";
import { EditorContent } from "./text-editor-content-context";

type CodeEditorContentContextType = {
  codeEditorContent: EditorContent;
  setCodeEditorContent: React.Dispatch<React.SetStateAction<EditorContent>>;
  diffPrev: RefObject<EditorState | undefined>;
  diffNext: string;
  setDiffNext: React.Dispatch<React.SetStateAction<string>>;
};

const CodeEditorContentContext = createContext<
  CodeEditorContentContextType | undefined
>(undefined);

interface Props {
  children: ReactNode;
}

export function CodeEditorContentProvider({ children }: Props) {
  const [codeEditorContent, setCodeEditorContent] = useState<EditorContent>({
    title: "",
    content: "",
  });

  const diffPrev = useRef<EditorState | undefined>(undefined);
  const [diffNext, setDiffNext] = useState("");

  return (
    <CodeEditorContentContext.Provider
      value={{
        codeEditorContent,
        setCodeEditorContent,
        diffPrev,
        diffNext,
        setDiffNext,
      }}
    >
      {children}
    </CodeEditorContentContext.Provider>
  );
}

export function useCodeEditorContent(): CodeEditorContentContextType {
  const context = useContext(CodeEditorContentContext);
  if (!context) {
    throw new Error(
      "useCodeEditorContent must be used within a CodeEditorContentProvider"
    );
  }
  return context;
}
