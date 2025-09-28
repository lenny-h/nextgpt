"use client";

import {
  GlobalTranslations,
  GlobalTranslationsProvider,
} from "@/contexts/global-translations";
import { type Locale } from "@/i18n.config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ThemeProvider as NextThemesProvider,
  ThemeProviderProps,
} from "next-themes";
import { Toaster } from "sonner";

interface Props extends ThemeProviderProps {
  globalTranslations: GlobalTranslations[Locale];
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
  globalTranslations,
  locale,
  nonce,
  ...props
}: Props) {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <NextThemesProvider nonce={nonce} {...props}>
          <GlobalTranslationsProvider
            globalT={globalTranslations}
            locale={locale}
          >
            {children}
          </GlobalTranslationsProvider>
        </NextThemesProvider>
      </QueryClientProvider>
      <Toaster position="bottom-right" richColors />
    </>
  );
}
