import { type ReactNode, createContext, useContext } from "react";
import deDictionary from "../dictionaries/de.json" with { type: "json" };
import enDictionary from "../dictionaries/en.json" with { type: "json" };
import { type Locale } from "../lib/i18n.config";

export type SharedTranslations = {
  en: typeof enDictionary;
  de: typeof deDictionary;
};

type SharedTranslationsContextType<T extends Locale> = {
  sharedT: SharedTranslations[T];
  locale: T;
};

interface Props<T extends Locale> {
  sharedT: SharedTranslations[T];
  locale: T;
  children: ReactNode;
}

const SharedTranslationsContext = createContext<
  SharedTranslationsContextType<Locale> | undefined
>(undefined);

export const SharedTranslationsProvider = <T extends Locale>({
  children,
  sharedT,
  locale,
}: Props<T>) => {
  return (
    <SharedTranslationsContext.Provider value={{ sharedT, locale }}>
      {children}
    </SharedTranslationsContext.Provider>
  );
};

export const useSharedTranslations = <T extends Locale>() => {
  const context = useContext(
    SharedTranslationsContext
  ) as SharedTranslationsContextType<T>;
  if (!context) {
    throw new Error(
      "useSharedTranslations must be used within a SharedTranslationsProvider"
    );
  }
  return context;
};
