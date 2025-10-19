"use client";

import { SidebarLeft } from "@/components/sidebars/sidebar-left";
import { AutocompleteProvider } from "@/contexts/autocomplete-context";
import { CSResultsProvider } from "@/contexts/classic-search-results";
import { CodeEditorContentProvider } from "@/contexts/code-editor-content-context";
import { EditorProvider } from "@/contexts/editor-context";
import { FilterProvider } from "@/contexts/filter-context";
import { PDFProvider } from "@/contexts/pdf-context";
import { RefsProvider } from "@/contexts/refs-context";
import { ChatModelProvider } from "@/contexts/selected-chat-model";
import { VSResultsProvider } from "@/contexts/semantic-search-results";
import { TempChatProvider } from "@/contexts/temporary-chat-context";
import { TextEditorContentProvider } from "@/contexts/text-editor-content-context";
import { type User } from "@workspace/server/drizzle/schema";
import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar-left";
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
          <TextEditorContentProvider>
            <CodeEditorContentProvider>
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
            </CodeEditorContentProvider>
          </TextEditorContentProvider>
        </EditorProvider>
      </RefsProvider>
    </UserProvider>
  );
}
