import { Providers } from "@/components/custom/providers";
import { i18n, type Locale } from "@/i18n.config";
import { getDictionary } from "@/lib/dictionary";
import { roboto } from "@/lib/fonts";
import type { Metadata } from "next";
import { headers } from "next/headers";

import "@workspace/ui/globals.css";

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export const metadata: Metadata = {
  // metadataBase: new URL("https://nextgpt.ai"),
  applicationName: "NextGpt",
  title: {
    default: "NextGpt",
    template: "%s - NextGpt",
  },
  description: "NextGpt is a chatbot developed for educational institutions.",
  keywords: ["nextgpt", "education", "chatbot"],
  robots: {
    index: true,
    follow: true,
    googleBot: "index, follow",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  alternates: {
    canonical: "/",
    languages: {
      de: "/de",
      en: "/en",
    },
  },
  // openGraph: {
  //   siteName: "NextGpt",
  //   type: "website",
  //   images: [{ url: "/en/opengraph-image.png" }],
  // },
  // twitter: {
  //   images: [{ url: "/en/twitter-image.png" }],
  // },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: Locale }>;
}>) {
  const lang = (await params).lang;
  const dictionary = await getDictionary(lang);
  const nonce = (await headers()).get("x-nonce") || "";

  return (
    <html lang={lang} suppressHydrationWarning>
      <body className={`${roboto.variable} antialiased`}>
        <Providers
          globalTranslations={dictionary.global}
          locale={lang}
          attribute="class"
          defaultTheme="system"
          enableSystem
          nonce={nonce}
        >
          {children}
        </Providers>
      </body>
    </html>
  );
}
