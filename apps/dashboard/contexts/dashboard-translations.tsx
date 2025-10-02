import deDictionary from "@/dictionaries/de.json";
import enDictionary from "@/dictionaries/en.json";
import { type Locale } from "@workspace/ui/lib/i18n.config";
import { type ReactNode, createContext, useContext } from "react";

export type DashboardTranslations = {
  en: typeof enDictionary;
  de: typeof deDictionary;
};

type DashboardTranslationsContextType<T extends Locale> = {
  dashboardT: DashboardTranslations[T];
};

interface Props<T extends Locale> {
  dashboardT: DashboardTranslations[T];
  children: ReactNode;
}

const DashboardTranslationsContext = createContext<
  DashboardTranslationsContextType<Locale> | undefined
>(undefined);

export const DashboardTranslationsProvider = <T extends Locale>({
  children,
  dashboardT,
}: Props<T>) => {
  return (
    <DashboardTranslationsContext.Provider value={{ dashboardT }}>
      {children}
    </DashboardTranslationsContext.Provider>
  );
};

export const useDashboardTranslations = <T extends Locale>() => {
  const context = useContext(
    DashboardTranslationsContext,
  ) as DashboardTranslationsContextType<T>;
  if (!context) {
    throw new Error(
      "useDashboardTranslations must be used within a DashboardTranslationsProvider",
    );
  }
  return context;
};
