"use client";

import React, {
  createContext,
  type ReactNode,
  useContext,
  useState,
} from "react";

type TempChatContextType = [
  boolean,
  React.Dispatch<React.SetStateAction<boolean>>,
];

const TempChatContext = createContext<TempChatContextType | undefined>(
  undefined
);

interface Props {
  children: ReactNode;
}

export function TempChatProvider({ children }: Props) {
  const [isTemporary, setIsTemporary] = useState(false);

  return (
    <TempChatContext.Provider value={[isTemporary, setIsTemporary]}>
      {children}
    </TempChatContext.Provider>
  );
}

export function useIsTemporary(): TempChatContextType {
  const context = useContext(TempChatContext);
  if (!context) {
    throw new Error("useIsTemporary must be used within a TempChatProvider");
  }
  return context;
}
