"use client";

import { SidebarLeft } from "@/components/sidebars/sidebar-left";
import { CSResultsProvider } from "@/contexts/classic-search-results";
import { DiffProvider } from "@/contexts/diff-context";
import { FilterProvider } from "@/contexts/filter-context";
import { PDFProvider } from "@/contexts/pdf-context";
import { ChatModelProvider } from "@/contexts/selected-chat-model";
import { VSResultsProvider } from "@/contexts/semantic-search-results";
import { TempChatProvider } from "@/contexts/temporary-chat-context";
import { type User } from "@workspace/server/drizzle/schema";
import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar-left";
import { AutocompleteProvider } from "@workspace/ui/contexts/autocomplete-context";
import { EditorProvider } from "@workspace/ui/contexts/editor-context";
import { RefsProvider } from "@workspace/ui/contexts/refs-context";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { UserProvider } from "@workspace/ui/contexts/user-context";
import { CentralLoadingScreen } from "@workspace/ui/custom-components/central-loading-screen";
import { client } from "@workspace/ui/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data, isPending } = client.useSession();
  const { locale } = useSharedTranslations();

  const router = useRouter();

  const [defaultLeftOpen, setDefaultLeftOpen] = useState(false);

  useEffect(() => {
    if (!isPending && !data?.user) {
      router.push(`/${locale}/sign-in`);
    }
  }, [data, isPending, locale]);

  useEffect(() => {
    const match = document.cookie
      .split("; ")
      .find((c) => c.startsWith("sidebar_left="));

    if (match) {
      setDefaultLeftOpen(match.split("=")[1] === "true");
    }
  }, []);

  if (isPending || !data?.user) {
    return <CentralLoadingScreen />;
  }

  console.log("Layout user data:", data);

  const user = data?.user;

  return (
    <UserProvider user={user as User}>
      <RefsProvider>
        <EditorProvider>
          <DiffProvider>
            <PDFProvider>
              <ChatModelProvider>
                <TempChatProvider>
                  <AutocompleteProvider>
                    <CSResultsProvider>
                      <VSResultsProvider>
                        <FilterProvider>
                          <SidebarProvider defaultOpen={defaultLeftOpen}>
                            <SidebarLeft />
                            <SidebarInset>{children}</SidebarInset>
                          </SidebarProvider>
                        </FilterProvider>
                      </VSResultsProvider>
                    </CSResultsProvider>
                  </AutocompleteProvider>
                </TempChatProvider>
              </ChatModelProvider>
            </PDFProvider>
          </DiffProvider>
        </EditorProvider>
      </RefsProvider>
    </UserProvider>
  );
}
