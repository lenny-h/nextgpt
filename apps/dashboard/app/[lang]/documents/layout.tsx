"use client";

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
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { UserProvider } from "@workspace/ui/contexts/user-context";
import { CentralLoadingScreen } from "@workspace/ui/custom-components/central-loading-screen";
import { client } from "@workspace/ui/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DocumentsLayout({
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
