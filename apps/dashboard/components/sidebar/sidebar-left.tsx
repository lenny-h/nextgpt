"use client"; // Change to server after changing team switcher

import { useGlobalTranslations } from "@/contexts/dashboard-translations";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar-left";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { memo } from "react";
import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";
import { NavUser } from "./nav-user";

export const SidebarLeft = memo(() => {
  const { locale } = useGlobalTranslations();
  const router = useRouter();

  return (
    <Sidebar variant="sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="hover:border-primary hover:bg-primary/10 cursor-pointer hover:border"
              onClick={() => router.push(`/${locale}/buckets`)}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                <Image
                  src="/android-chrome-192x192.png"
                  alt="NextGPT Logo"
                  width={40}
                  height={40}
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">NextGPT</span>
                <span className="truncate text-xs">Let's learn together!</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        <NavSecondary />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
});
