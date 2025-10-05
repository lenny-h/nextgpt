import { useWebTranslations } from "@/contexts/web-translations";
import { Chat } from "@workspace/server/drizzle/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar-left";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { MoreHorizontal, Pencil, Star, StarOff, Trash2 } from "lucide-react";
import Link from "next/link";
import { memo } from "react";

interface PureChatItemProps {
  chat: Chat;
  isActive: boolean;
  isFavorite: boolean;
  onFavorite: (chatId: string) => void;
  onRename: (chat: Chat) => void;
  onDelete: (chatId: string) => void;
  isMobile: boolean;
  setOpenMobile: (open: boolean) => void;
}

const PureChatItem = ({
  chat,
  isActive,
  isFavorite,
  onFavorite,
  onRename,
  onDelete,
  isMobile,
  setOpenMobile,
}: PureChatItemProps) => {
  const { locale, sharedT } = useSharedTranslations();
  const { webT } = useWebTranslations();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton className="h-9" asChild isActive={isActive}>
        <Link
          href={
            chat.title === "Practice Session"
              ? `/${locale}/practice/${chat.id}`
              : `/${locale}/chat/${chat.id}`
          }
          onClick={() => setOpenMobile(false)}
        >
          <span>{chat.title}</span>
        </Link>
      </SidebarMenuButton>

      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            className="mr-0.5 cursor-pointer"
            showOnHover={!isActive}
          >
            <MoreHorizontal />
            <span className="sr-only">{webT.chatItem.more}</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-56 rounded-lg"
          side={isMobile ? "bottom" : "right"}
          align={isMobile ? "end" : "start"}
        >
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={() => onFavorite(chat.id)}
          >
            {isFavorite ? (
              <>
                <StarOff className="text-muted-foreground" />
                <span>{webT.chatItem.removeFromFavorites}</span>
              </>
            ) : (
              <>
                <Star />
                <span>{webT.chatItem.addToFavourites}</span>
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={() => onRename(chat)}
          >
            <Pencil />
            <span>{webT.chatItem.rename}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer text-red-500 focus:text-red-400"
            onSelect={() => onDelete(chat.id)}
          >
            <Trash2 />
            <span>{webT.chatItem.delete}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  if (prevProps.chat.id !== nextProps.chat.id) return false;
  if (prevProps.chat.title !== nextProps.chat.title) return false;
  if (prevProps.isActive !== nextProps.isActive) return false;
  return true;
});
