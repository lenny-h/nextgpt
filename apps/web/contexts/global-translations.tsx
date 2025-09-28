import deDictionary from "@/dictionaries/de.json";
import enDictionary from "@/dictionaries/en.json";
import { type Locale } from "@/i18n.config";
import { type ReactNode, createContext, useContext } from "react";

export type GlobalTranslations = {
  en: typeof enDictionary.global;
  de: typeof deDictionary.global;
};

type GlobalTranslationsContextType<T extends Locale> = {
  globalT: GlobalTranslations[T];
  locale: T;
};

interface Props<T extends Locale> {
  globalT: GlobalTranslations[T];
  locale: T;
  children: ReactNode;
}

const GlobalTranslationsContext = createContext<
  GlobalTranslationsContextType<Locale> | undefined
>(undefined);

export const GlobalTranslationsProvider = <T extends Locale>({
  children,
  globalT,
  locale,
}: Props<T>) => {
  return (
    <GlobalTranslationsContext.Provider value={{ globalT, locale }}>
      {children}
    </GlobalTranslationsContext.Provider>
  );
};

export const useGlobalTranslations = <T extends Locale>() => {
  const context = useContext(
    GlobalTranslationsContext
  ) as GlobalTranslationsContextType<T>;
  if (!context) {
    throw new Error(
      "useGlobalTranslations must be used within a GlobalTranslationsProvider"
    );
  }
  return context;
};
