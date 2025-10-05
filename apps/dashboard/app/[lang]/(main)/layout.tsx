import { BreadcrumbHeader } from "@/components/custom/breadcrumb-header";
import { SidebarLeft } from "@/components/sidebar/sidebar-left";
import { auth } from "@workspace/server/auth-server";
import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar-left";
import { UserProvider } from "@workspace/ui/contexts/user-context";
import { type Locale } from "@workspace/ui/lib/i18n.config";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function MainLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: Locale }>;
}) {
  const lang = (await params).lang;

  const headersStore = await headers();

  const session = await auth.api.getSession({
    headers: headersStore,
  });

  const user = session?.user
    ? { ...session.user, image: session.user.image ?? null }
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
