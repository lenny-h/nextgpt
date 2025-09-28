import { SidebarLeft } from "@/components/sidebar/sidebar-left";
import { AutocompleteProvider } from "@/contexts/autocomplete-context";
import { CodeEditorContentProvider } from "@/contexts/code-editor-content-context";
import { EditorProvider } from "@/contexts/editor-context";
import { RefsProvider } from "@/contexts/refs-context";
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

export default async function DocumentsLayout({
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
    redirect(`/${lang}/sign-in`);
  }

  const cookieStore = await cookies();
  const defaultLeftOpen = cookieStore.get("sidebar_left")?.value === "true";

  return (
    <UserProvider user={user}>
      <RefsProvider>
        <EditorProvider>
          <TextEditorContentProvider>
            <CodeEditorContentProvider>
              <AutocompleteProvider>
                <SidebarProvider defaultOpen={defaultLeftOpen}>
                  <SidebarLeft />
                  <SidebarInset>{children}</SidebarInset>
                </SidebarProvider>
              </AutocompleteProvider>
            </CodeEditorContentProvider>
          </TextEditorContentProvider>
        </EditorProvider>
      </RefsProvider>
    </UserProvider>
  );
}
