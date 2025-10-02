"use client";

import { useGlobalTranslations } from "@/contexts/web-translations";
import { useIsTemporary } from "@/contexts/temporary-chat-context";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar-left";
import { Switch } from "@workspace/ui/components/switch";
import {
  ExternalLink,
  FileText,
  GraduationCap,
  MessageCircleDashed,
  MessageCirclePlus,
  Search,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function NavMain() {
  const { locale } = useGlobalTranslations();
  const [tempChat, setTempChat] = useIsTemporary();

  const pathname = usePathname();
  const router = useRouter();

  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          className="cursor-pointer"
          onClick={() => {
            setOpenMobile(false);

            if (pathname.includes("practice")) {
              router.push(`/${locale}/practice`);
            } else {
              router.push(`/${locale}`);
            }

            router.refresh();
          }}
        >
          <MessageCirclePlus className="text-primary" />
          <span>
            New {pathname.includes("/practice") ? "practice session" : "chat"}
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {(pathname === `/${locale}` || pathname.endsWith("/practice")) && (
        <SidebarMenuItem className="flex items-center space-x-2">
          <SidebarMenuButton
            className="w-fit cursor-pointer"
            onClick={() => setTempChat(!tempChat)}
          >
            <MessageCircleDashed />
            <span>Temporary chat</span>
          </SidebarMenuButton>
          <Switch
            id="temp"
            checked={tempChat}
            onCheckedChange={setTempChat}
            className="cursor-pointer"
          />
        </SidebarMenuItem>
      )}

      <SidebarMenuItem className="mt-4">
        <SidebarMenuButton
          asChild
          isActive={pathname === `/${locale}` || pathname.includes("chat")}
        >
          <Link href={`/${locale}`}>
            <Sparkles />
            <span>Chat</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname.includes("practice")}>
          <Link href={`/${locale}/practice`}>
            <GraduationCap />
            <span>Practice</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname === `/${locale}/search`}>
          <Link href={`/${locale}/search`}>
            <Search />
            <span>Search</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={pathname === `/${locale}/documents`}
        >
          <Link href={`/${locale}/documents`}>
            <FileText />
            <span>Documents</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link href={process.env.NEXT_PUBLIC_DASHBOARD_URL!}>
            <ExternalLink />
            <span>Dashboard</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
