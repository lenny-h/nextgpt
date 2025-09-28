import { BreadcrumbHeader } from "@/components/custom/breadcrumb-header";
import { SidebarLeft } from "@/components/sidebar/sidebar-left";
import { EditorProvider } from "@/contexts/editor-context";
import { RefsProvider } from "@/contexts/refs-context";
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
      <SidebarProvider defaultOpen={defaultLeftOpen}>
        <SidebarLeft />
        <SidebarInset>
          <BreadcrumbHeader />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </UserProvider>
  );
}
