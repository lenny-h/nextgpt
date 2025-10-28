"use client";

import { type EditorState as CodeEditorState } from "@codemirror/state";
import { type EditorState as TextEditorState } from "prosemirror-state";
import React, {
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
  useRef,
  useState,
} from "react";

type DiffContextType = {
  textDiffPrev: RefObject<TextEditorState | undefined>;
  textDiffNext: string;
  setTextDiffNext: React.Dispatch<React.SetStateAction<string>>;
  codeDiffPrev: RefObject<CodeEditorState | undefined>;
  codeDiffNext: string;
  setCodeDiffNext: React.Dispatch<React.SetStateAction<string>>;
  isBlocked: boolean;
};

const DiffContext = createContext<DiffContextType | undefined>(undefined);

interface Props {
  children: ReactNode;
}

export function DiffProvider({ children }: Props) {
  const textDiffPrev = useRef<TextEditorState | undefined>(undefined);
  const [textDiffNext, setTextDiffNext] = useState("");
  const codeDiffPrev = useRef<CodeEditorState | undefined>(undefined);
  const [codeDiffNext, setCodeDiffNext] = useState("");

  const isBlocked =
    textDiffPrev.current !== undefined || codeDiffPrev.current !== undefined;

  return (
    <DiffContext.Provider
      value={{
        textDiffPrev,
        textDiffNext,
        setTextDiffNext,
        codeDiffPrev,
        codeDiffNext,
        setCodeDiffNext,
        isBlocked,
      }}
    >
      {children}
    </DiffContext.Provider>
  );
}

export function useDiff(): DiffContextType {
  const context = useContext(DiffContext);
  if (!context) {
    throw new Error("useDiff must be used within a DiffProvider");
  }
  return context;
}
