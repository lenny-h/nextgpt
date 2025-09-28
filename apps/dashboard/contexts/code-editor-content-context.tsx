"use client";

import React, {
  createContext,
  type ReactNode,
  useContext,
  useState,
} from "react";
import { type EditorContent } from "./text-editor-content-context";

type CodeEditorContentContextType = {
  codeEditorContent: EditorContent;
  setCodeEditorContent: React.Dispatch<React.SetStateAction<EditorContent>>;
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
  return (
    <CodeEditorContentContext.Provider
      value={{
        codeEditorContent,
        setCodeEditorContent,
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
