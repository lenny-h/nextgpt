"use client";

import React, {
  createContext,
  type ReactNode,
  useContext,
  useState,
} from "react";

export type EditorContent = {
  id?: string;
  title: string;
  content: string;
};

type TextEditorContentContextType = {
  textEditorContent: EditorContent;
  setTextEditorContent: React.Dispatch<React.SetStateAction<EditorContent>>;
};

const TextEditorContentContext = createContext<
  TextEditorContentContextType | undefined
>(undefined);

interface Props {
  children: ReactNode;
}

export function TextEditorContentProvider({ children }: Props) {
  const [textEditorContent, setTextEditorContent] = useState<EditorContent>({
    title: "",
    content: "",
  });

  return (
    <TextEditorContentContext.Provider
      value={{
        textEditorContent,
        setTextEditorContent,
      }}
    >
      {children}
    </TextEditorContentContext.Provider>
  );
}

export function useTextEditorContent(): TextEditorContentContextType {
  const context = useContext(TextEditorContentContext);
  if (!context) {
    throw new Error(
      "useTextEditorContent must be used within a TextEditorContentProvider"
    );
  }
  return context;
}
