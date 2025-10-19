"use client";

import { BreadcrumbHeader } from "@/components/custom/breadcrumb-header";
import { SidebarLeft } from "@/components/sidebar/sidebar-left";
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
