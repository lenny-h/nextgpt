"use client";

import React, {
  createContext,
  type ReactNode,
  useContext,
  useState,
} from "react";

export type EditorMode = "text" | "code";

type EditorContextType = [
  EditorMode,
  React.Dispatch<React.SetStateAction<EditorMode>>,
];

const EditorContext = createContext<EditorContextType | undefined>(undefined);

interface Props {
  children: ReactNode;
}

export function EditorProvider({ children }: Props) {
  const [editorMode, setEditorMode] = useState<EditorMode>("text");

  return (
    <EditorContext.Provider value={[editorMode, setEditorMode]}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor(): EditorContextType {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditor must be used within a EditorProvider");
  }
  return context;
}
