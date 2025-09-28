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
import { UserProvider } from "@/contexts/user-context";
import { type Locale } from "@/i18n.config";
import { createClient } from "@/lib/supabase/server";
import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar-left";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function MainLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: Locale }>;
}) {
  const lang = (await params).lang;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect(`/${lang}/sign-in`);
  }

  const cookieStore = await cookies();
  const defaultLeftOpen = cookieStore.get("sidebar_left")?.value === "true";

  return (
    <UserProvider user={user}>
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
