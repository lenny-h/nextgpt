"use client";

import {
  DashboardTranslationsProvider,
  type DashboardTranslations,
} from "@/contexts/dashboard-translations";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  SharedTranslationsProvider,
  type SharedTranslations,
} from "@workspace/ui/contexts/shared-translations-context";
import { type Locale } from "@workspace/ui/lib/i18n.config";
import {
  ThemeProvider as NextThemesProvider,
  ThemeProviderProps,
} from "next-themes";
import { Toaster } from "sonner";

interface Props extends ThemeProviderProps {
  sharedTranslations: SharedTranslations[Locale];
  dashboardTranslations: DashboardTranslations[Locale];
  locale: Locale;
  nonce?: string;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 180 * 60 * 1000, // 3 hours
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function Providers({
  children,
  sharedTranslations,
  dashboardTranslations,
  locale,
  nonce,
  ...props
}: Props) {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <NextThemesProvider nonce={nonce} {...props}>
          <SharedTranslationsProvider
            sharedT={sharedTranslations}
            locale={locale}
          >
            <DashboardTranslationsProvider dashboardT={dashboardTranslations}>
              {children}
            </DashboardTranslationsProvider>
          </SharedTranslationsProvider>
        </NextThemesProvider>
      </QueryClientProvider>
      <Toaster position="bottom-right" richColors />
    </>
  );
}
