"use client";

import { signOutAction } from "@/actions";
import { useGlobalTranslations } from "@/contexts/web-translations";
import { useUser } from "@/contexts/user-context";
import { rpcFetcher } from "@/lib/fetcher";
import { useQuery } from "@tanstack/react-query";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar-left";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { ChevronsUpDown, LogOut, PartyPopper, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, useState } from "react";
import { InvitationsDialog } from "../custom/invitations-dialog";
import { LocaleSwitcher } from "../custom/locale-switcher";
import { ThemeSwitcher } from "../custom/theme-switcher";

export const NavUser = memo(() => {
  const isMobile = useIsMobile();
  const [invitationsOpen, setInvitationsOpen] = useState(false);

  const user = useUser();
  const { locale } = useGlobalTranslations();

  const router = useRouter();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => rpcFetcher<"get_user_profile">("get_user_profile"),
  });

  const username = profile?.[0]?.username;

  const initials = username
    ?.split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.user_metadata.avatar_url ?? undefined} />
                <AvatarFallback className="rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {username ?? "No username"}
                </span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={9}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={user.user_metadata.avatar_url ?? undefined}
                  />
                  <AvatarFallback className="rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {username ?? "Unnamed"}
                  </span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                disabled={isLoading}
                onClick={() => {
                  router.push(`/${locale}/profile`);
                }}
              >
                <User />
                {isLoading
                  ? "Loading..."
                  : profile?.[0]
                    ? "Update profile"
                    : "Create profile"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setInvitationsOpen(true)}>
                <PartyPopper />
                Invitations
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <LocaleSwitcher />
              <ThemeSwitcher />
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await signOutAction();
              }}
            >
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      <InvitationsDialog
        open={invitationsOpen}
        onOpenChange={setInvitationsOpen}
      />
    </SidebarMenu>
  );
});
