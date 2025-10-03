"use client"; // Change to server after changing team switcher

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar-left";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { NavUser } from "@workspace/ui/custom-components/nav-user";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { memo } from "react";
import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";

export const SidebarLeft = memo(() => {
  const { locale } = useSharedTranslations();
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
