"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronsUpDown, LogOut, PartyPopper, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../components/sidebar-left";
import { useSharedTranslations } from "../contexts/shared-translations-context";
import { useUser } from "../contexts/user-context";
import { useIsMobile } from "../hooks/use-mobile";
import { client } from "../lib/auth-client";
import { apiFetcher } from "../lib/fetcher";
import { InvitationsDialog } from "./invitations-dialog";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeSwitcher } from "./theme-switcher";

export const NavUser = memo(() => {
  const { locale, sharedT } = useSharedTranslations();

  const user = useUser();
  const isMobile = useIsMobile();
  const router = useRouter();

  const [invitationsOpen, setInvitationsOpen] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () =>
      apiFetcher((client) => client.profiles.$get(), sharedT.apiCodes),
  });

  const username = profile?.username;

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
                <AvatarImage src={undefined} />
                <AvatarFallback className="rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {username ?? sharedT.navUser.noUsername}
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
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {username ?? sharedT.navUser.unnamed}
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
                  ? sharedT.navUser.loading
                  : sharedT.navUser.updateProfile}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setInvitationsOpen(true)}>
                <PartyPopper />
                {sharedT.navUser.invitations}
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
                await client.signOut();
              }}
            >
              <LogOut />
              {sharedT.navUser.logOut}
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
