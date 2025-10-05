import { BreadcrumbHeader } from "@/components/custom/breadcrumb-header";
import { SidebarLeft } from "@/components/sidebar/sidebar-left";
import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar-left";
import { UserProvider } from "@workspace/ui/contexts/user-context";
import { client } from "@workspace/ui/lib/auth-client";
import { type Locale } from "@workspace/ui/lib/i18n.config";
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
