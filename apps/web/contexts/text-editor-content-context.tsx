"use client";

import { EditorState } from "prosemirror-state";
import React, {
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
  useRef,
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
  diffPrev: RefObject<EditorState | undefined>;
  diffPrevString: string;
  setDiffPrevString: React.Dispatch<React.SetStateAction<string>>;
  diffNext: string;
  setDiffNext: React.Dispatch<React.SetStateAction<string>>;
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

  const diffPrev = useRef<EditorState | undefined>(undefined);
  const [diffPrevString, setDiffPrevString] = useState("");
  const [diffNext, setDiffNext] = useState("");

  return (
    <TextEditorContentContext.Provider
      value={{
        textEditorContent,
        setTextEditorContent,
        diffPrev,
        diffPrevString,
        setDiffPrevString,
        diffNext,
        setDiffNext,
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
