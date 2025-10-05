"use client";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@workspace/ui/components/sidebar-left";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import {
  ArchiveRestore,
  Brain,
  ExternalLink,
  File,
  FileUp,
  FolderUp,
  ListTodo,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo } from "react";

export const NavMain = memo(() => {
  const { locale } = useSharedTranslations();

  const pathname = usePathname();

  return (
    <SidebarMenu className="mt-4">
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <a href={process.env.NEXT_PUBLIC_CHAT_URL!}>
            <ExternalLink />
            <span>Chat</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem className="mt-4">
        <SidebarMenuButton asChild isActive={pathname === `/${locale}/buckets`}>
          <Link href={`/${locale}/buckets`}>
            <ArchiveRestore />
            <span>Buckets</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname === `/${locale}/courses`}>
          <Link href={`/${locale}/courses`}>
            <FolderUp />
            <span>Courses</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname === `/${locale}/files`}>
          <Link href={`/${locale}/files`}>
            <FileUp />
            <span>Files</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname === `/${locale}/tasks`}>
          <Link href={`/${locale}/tasks`}>
            <ListTodo />
            <span>Tasks</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarSeparator />

      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={pathname === `/${locale}/correction`}
        >
          <Link href={`/${locale}/correction`}>
            <Pencil />
            <span>Correction</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={pathname === `/${locale}/documents`}
        >
          <Link href={`/${locale}/documents`}>
            <File />
            <span>Documents</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <SidebarSeparator />

      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname === `/${locale}/models`}>
          <Link href={`/${locale}/models`}>
            <Brain />
            <span>Models</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
});
