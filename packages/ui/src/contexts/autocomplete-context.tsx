"use client";

import React, {
  createContext,
  type ReactNode,
  useContext,
  useState,
  useEffect,
} from "react";

export type Autocomplete = {
  code: boolean;
  text: boolean;
};

type AutocompleteContextType = [
  Autocomplete,
  React.Dispatch<React.SetStateAction<Autocomplete>>,
];

const AutocompleteContext = createContext<AutocompleteContextType | undefined>(
  undefined
);

interface Props {
  children: ReactNode;
}

export function AutocompleteProvider({ children }: Props) {
  const [autocomplete, setAutocomplete] = useState<Autocomplete>({
    code: false,
    text: true,
  });

  useEffect(() => {
    const storedAutocomplete = localStorage.getItem("autocomplete");
    if (storedAutocomplete) {
      setAutocomplete(JSON.parse(storedAutocomplete));
    }
  }, []);

  return (
    <AutocompleteContext.Provider value={[autocomplete, setAutocomplete]}>
      {children}
    </AutocompleteContext.Provider>
  );
}

export function useAutocomplete(): AutocompleteContextType {
  const context = useContext(AutocompleteContext);
  if (!context) {
    throw new Error(
      "useAutocomplete must be used within a AutocompleteProvider"
    );
  }
  return context;
}
