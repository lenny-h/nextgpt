"use client";

import type { EditorView as CodeEditorView } from "@codemirror/view";
import type { EditorView as TextEditorView } from "prosemirror-view";
import {
  type ReactNode,
  createContext,
  useContext,
  useRef,
  useState,
} from "react";
import { type ImperativePanelHandle } from "react-resizable-panels";

interface Props {
  children: ReactNode;
}

interface RefsContextType {
  panelRef: React.RefObject<ImperativePanelHandle | null>;
  textEditorRef: React.RefObject<TextEditorView | null>;
  codeEditorRef: React.RefObject<CodeEditorView | null>;
  size: number;
  setSize: (size: number) => void;
}

const RefsContext = createContext<RefsContextType | undefined>(undefined);

export const RefsProvider = ({ children }: Props) => {
  const panelRef = useRef<ImperativePanelHandle | null>(null);
  const textEditorRef = useRef<TextEditorView | null>(null);
  const codeEditorRef = useRef<CodeEditorView | null>(null);
  const [size, setSize] = useState(0);

  return (
    <RefsContext.Provider
      value={{
        panelRef,
        textEditorRef,
        codeEditorRef,
        size,
        setSize,
      }}
    >
      {children}
    </RefsContext.Provider>
  );
};

export const useRefs = () => {
  const context = useContext(RefsContext);
  if (!context) {
    throw new Error("useRefs must be used within a RefsProvider");
  }
  return context;
};
