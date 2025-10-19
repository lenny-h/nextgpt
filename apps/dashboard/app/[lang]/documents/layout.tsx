import { SidebarLeft } from "@/components/sidebar/sidebar-left";
import { AutocompleteProvider } from "@/contexts/autocomplete-context";
import { CodeEditorContentProvider } from "@/contexts/code-editor-content-context";
import { EditorProvider } from "@/contexts/editor-context";
import { RefsProvider } from "@/contexts/refs-context";
import { TextEditorContentProvider } from "@/contexts/text-editor-content-context";
import { type User } from "@workspace/server/drizzle/schema";
import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar-left";
import { UserProvider } from "@workspace/ui/contexts/user-context";
import { client } from "@workspace/ui/lib/auth-client";
import { type Locale } from "@workspace/ui/lib/i18n.config";
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

  const { data } = await client.getSession();

  const user = data?.user
    ? { ...data.user, image: data.user.image ?? null }
    : null;

  if (!user) {
    return redirect(`/${lang}/sign-in`);
  }

  const cookieStore = await cookies();
  const defaultLeftOpen = cookieStore.get("sidebar_left")?.value === "true";

  return (
    <UserProvider user={user as User}>
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
