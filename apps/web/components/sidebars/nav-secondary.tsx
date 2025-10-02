import { Send } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar-left";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import Link from "next/link";

export const NavSecondary = () => {
  const { locale } = useSharedTranslations();

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="sm">
              <Link href={`/${locale}/feedback`}>
                <Send />
                <span>Feedback</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
