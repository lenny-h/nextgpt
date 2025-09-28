"use client";

import type { DocumentSource } from "@/types/document-source";
import React, {
  createContext,
  type ReactNode,
  useContext,
  useState,
} from "react";

type CSResultsContextType = [
  Array<DocumentSource>,
  React.Dispatch<React.SetStateAction<Array<DocumentSource>>>,
];

const CSResultsContext = createContext<CSResultsContextType | undefined>(
  undefined
);

interface Props {
  children: ReactNode;
}

export function CSResultsProvider({ children }: Props) {
  const [csResults, setCsResults] = useState([] as Array<DocumentSource>);

  return (
    <CSResultsContext.Provider value={[csResults, setCsResults]}>
      {children}
    </CSResultsContext.Provider>
  );
}

export function useCSResults(): CSResultsContextType {
  const context = useContext(CSResultsContext);
  if (!context) {
    throw new Error("useCSResults must be used within a CSResultsProvider");
  }
  return context;
}
