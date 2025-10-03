"use client"; // Change to server after changing team switcher

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@workspace/ui/components/sidebar-left";
import { NavUser } from "@workspace/ui/custom-components/nav-user";
import { BucketSwitcher } from "./bucket-switcher";
import { NavHistory } from "./nav-history";
import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";

export const SidebarLeft = () => {
  return (
    <Sidebar variant="floating" className="border-r-0">
      <SidebarHeader>
        <BucketSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        <NavHistory />
      </SidebarContent>
      <SidebarFooter>
        <NavSecondary />
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};
