"use client";

import { type DocumentSource } from "@workspace/api-routes/types/document-source";
import React, {
  createContext,
  type ReactNode,
  useContext,
  useState,
} from "react";

type VSResultsContextType = [
  Array<DocumentSource>,
  React.Dispatch<React.SetStateAction<Array<DocumentSource>>>,
];

const VSResultsContext = createContext<VSResultsContextType | undefined>(
  undefined,
);

interface Props {
  children: ReactNode;
}

export function VSResultsProvider({ children }: Props) {
  const [vsResults, setVsResults] = useState([] as Array<DocumentSource>);

  return (
    <VSResultsContext.Provider value={[vsResults, setVsResults]}>
      {children}
    </VSResultsContext.Provider>
  );
}

export function useVSResults(): VSResultsContextType {
  const context = useContext(VSResultsContext);
  if (!context) {
    throw new Error("useVSResults must be used within a VSResultsProvider");
  }
  return context;
}
