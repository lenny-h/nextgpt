import deDictionary from "@/dictionaries/de.json";
import enDictionary from "@/dictionaries/en.json";
import { type Locale } from "@/i18n.config";
import { type ReactNode, createContext, useContext } from "react";

export type WebTranslations = {
  en: typeof enDictionary;
  de: typeof deDictionary;
};

type WebTranslationsContextType<T extends Locale> = {
  webT: WebTranslations[T];
};

interface Props<T extends Locale> {
  webT: WebTranslations[T];
  children: ReactNode;
}

const WebTranslationsContext = createContext<
  WebTranslationsContextType<Locale> | undefined
>(undefined);

export const WebTranslationsProvider = <T extends Locale>({
  children,
  webT,
}: Props<T>) => {
  return (
    <WebTranslationsContext.Provider value={{ webT }}>
      {children}
    </WebTranslationsContext.Provider>
  );
};

export const useWebTranslations = <T extends Locale>() => {
  const context = useContext(
    WebTranslationsContext,
  ) as WebTranslationsContextType<T>;
  if (!context) {
    throw new Error(
      "useWebTranslations must be used within a WebTranslationsProvider",
    );
  }
  return context;
};
