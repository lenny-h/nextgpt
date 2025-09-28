"use client";

import { useInfiniteQueryWithRPC } from "@/hooks/use-infinite-query";
import {
  removeFromInfiniteCache,
  rpcFetcher,
  updateInfiniteCache,
} from "@/lib/fetcher";
import { createClient } from "@/lib/supabase/client";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar-left";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  RenameForm,
  type RenameFormData,
} from "@workspace/ui/editors/rename-form";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { type Tables } from "@workspace/ui/types/database";
import { isToday, isYesterday, subMonths, subWeeks } from "date-fns";
import { Loader2, MoreHorizontal } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ChatItem } from "../custom/chat-item";
import { ChatSearch } from "../custom/chat-search";
import { KeyboardShortcut } from "../custom/keyboard-shortcut";

type GroupedChats = {
  today: Tables<"chats">[];
  yesterday: Tables<"chats">[];
  lastWeek: Tables<"chats">[];
  lastMonth: Tables<"chats">[];
  older: Tables<"chats">[];
};

export function NavHistory() {
  const queryClient = useQueryClient();

  const { id } = useParams();
  const router = useRouter();

  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar();

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [currentTitle, setCurrentTitle] = useState("");

  const {
    data: chats,
    isPending: isPendingChats,
    error: chatsError,
    hasNextPage: hasNextPageChats,
    isFetchingNextPage: isFetchingNextPageChats,
    inViewRef,
  } = useInfiniteQueryWithRPC({
    queryKey: ["chats"],
    procedure: "get_user_chats",
  });

  const {
    data,
    isPending: isPendingFavourites,
    error: favouriteUserChatError,
    fetchNextPage: fetchNextPageFavourites,
    hasNextPage: hasNextPageFavourites,
    isFetchingNextPage: isFetchingNextPageFavourites,
  } = useInfiniteQuery({
    queryKey: ["favourites"],
    queryFn: async ({ pageParam }) => {
      return rpcFetcher("get_favourite_user_chats", {
        ...(pageParam !== undefined ? { page_number: pageParam } : {}),
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < 10) return undefined;
      return lastPage.length;
    },
  });

  const favouriteChats = data?.pages.flatMap((page) => page) || [];

  const updateChat = async (chatId: string, isFavourite: boolean) => {
    const supabase = createClient();

    const { error } = await supabase.rpc("set_is_favourite", {
      p_chat_id: chatId,
      p_is_favourite: isFavourite,
    });

    if (error) {
      throw new Error("Failed to update chat");
    }
  };

  const renameChat = async (chatId: string, newTitle: string) => {
    const supabase = createClient();

    const { error } = await supabase.rpc("update_chat_title", {
      p_chat_id: chatId,
      p_title: newTitle,
    });

    if (error) {
      throw new Error("Failed to rename chat");
    }
  };

  const deleteChat = async (chatId: string) => {
    const supabase = createClient();

    const { error } = await supabase.rpc("delete_chat", {
      p_chat_id: chatId,
    });

    if (error) {
      throw new Error("Failed to delete chat");
    }
  };

  const handleAdd = async (chatId: string) => {
    toast.promise(updateChat(chatId, true), {
      loading: "Adding chat to favourites...",
      success: () => {
        // Update the cache
        queryClient.invalidateQueries({ queryKey: ["favourites"] });
        queryClient.setQueryData(["liked", chatId], [{ is_favourite: true }]);

        return "Chat added to favourites";
      },
      error: "Failed to add chat to favourites",
    });
  };

  const handleRemove = async (chatId: string) => {
    toast.promise(updateChat(chatId, false), {
      loading: "Removing chat from favourites...",
      success: () => {
        // Update the cache
        removeFromInfiniteCache(queryClient, ["favourites"], chatId);
        queryClient.setQueryData(["liked", chatId], [{ is_favourite: false }]);

        return "Chat removed from favourites";
      },
      error: "Failed to remove chat from favourites",
    });
  };

  const handleRename = (chat: Tables<"chats">) => {
    setCurrentChatId(chat.id);
    setCurrentTitle(chat.title);
    setRenameDialogOpen(true);
  };

  const handleDelete = async (chatId: string) => {
    toast.promise(deleteChat(chatId), {
      loading: "Deleting chat...",
      success: () => {
        // Update the cache
        removeFromInfiniteCache(queryClient, ["chats"], chatId);
        removeFromInfiniteCache(queryClient, ["favourites"], chatId);

        return "Chat deleted successfully";
      },
      error: "Failed to delete chat",
    });

    if (chatId === id) {
      router.push("/");
    }
  };

  const onSubmit = async (values: RenameFormData) => {
    if (!currentChatId || values.title === currentTitle) {
      setRenameDialogOpen(false);
      return;
    }

    renameChat(currentChatId, values.title);
  };

  const handleSuccess = (values: RenameFormData) => {
    setRenameDialogOpen(false);

    // Update the cache
    queryClient.setQueryData(
      ["chatTitle", currentChatId],
      [{ title: values.title }],
    );
    updateInfiniteCache(queryClient, ["chats"], (item) => {
      return item.id !== currentChatId
        ? item
        : { ...item, title: values.title };
    });
    updateInfiniteCache(queryClient, ["favourites"], (item) => {
      return item.id !== currentChatId
        ? item
        : { ...item, title: values.title };
    });

    return "Chat renamed!";
  };

  const groupChatsByDate = (chats: Tables<"chats">[]): GroupedChats => {
    const now = new Date();
    const oneWeekAgo = subWeeks(now, 1);
    const oneMonthAgo = subMonths(now, 1);

    return chats.reduce(
      (groups, chat) => {
        const chatDate = new Date(chat.created_at);

        if (isToday(chatDate)) {
          groups.today.push(chat);
        } else if (isYesterday(chatDate)) {
          groups.yesterday.push(chat);
        } else if (chatDate > oneWeekAgo) {
          groups.lastWeek.push(chat);
        } else if (chatDate > oneMonthAgo) {
          groups.lastMonth.push(chat);
        } else {
          groups.older.push(chat);
        }

        return groups;
      },
      {
        today: [],
        yesterday: [],
        lastWeek: [],
        lastMonth: [],
        older: [],
      } as GroupedChats,
    );
  };

  if (isPendingChats || isPendingFavourites) {
    return (
      <SidebarGroup>
        <div className="text-sidebar-foreground/50 px-2 py-1 text-xs">
          Today
        </div>
        <SidebarGroupContent>
          <div className="flex flex-col space-y-3">
            {Array(5)
              .fill(null)
              .map((_, index) => (
                <Skeleton key={index} className="h-5 w-full rounded-md" />
              ))}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (chatsError || favouriteUserChatError) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="flex w-full flex-row items-center justify-center text-sm">
            There was an error loading your conversations. Please try again.
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (chats.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="flex w-full flex-row items-center justify-center text-sm">
            Your conversations will appear here once you start chatting!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <>
      <RenameForm
        renameDialogOpen={renameDialogOpen}
        setRenameDialogOpen={setRenameDialogOpen}
        onSubmit={onSubmit}
        handleSuccess={handleSuccess}
        defaultTitle={currentTitle}
        type="chat"
      />

      {favouriteChats.length > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel>Favorites</SidebarGroupLabel>
          <SidebarMenu>
            {favouriteChats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === id}
                isFavorite={true}
                onFavorite={handleRemove}
                onRename={handleRename}
                onDelete={handleRemove}
                isMobile={isMobile}
                setOpenMobile={setOpenMobile}
              />
            ))}
            {hasNextPageFavourites && !isFetchingNextPageFavourites && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="text-sidebar-foreground/70"
                  onClick={() => fetchNextPageFavourites()}
                >
                  <MoreHorizontal />
                  <span>More</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {isFetchingNextPageFavourites && (
              <div className="flex items-center justify-center">
                <Loader2 className="size-4 animate-spin" />
              </div>
            )}
          </SidebarMenu>
        </SidebarGroup>
      )}
      <SidebarGroup>
        {/* <div className="flex flex-row gap-2"> */}
        <SidebarGroupLabel>Chat history</SidebarGroupLabel>
        <ChatSearch>
          <button className="hover:bg-muted mb-4 flex w-fit cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-xs">
            Quick search
            <KeyboardShortcut keys={["⌘", "a"]} />
          </button>
        </ChatSearch>
        {/* </div> */}
        <SidebarGroupContent>
          <SidebarMenu>
            {chats &&
              (() => {
                const groupedChats = groupChatsByDate(chats);

                return (
                  <>
                    {groupedChats.today.length > 0 && (
                      <>
                        <div className="text-sidebar-foreground/50 px-2 py-1 text-xs">
                          Today
                        </div>
                        {groupedChats.today.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            isFavorite={false}
                            onFavorite={handleAdd}
                            onRename={handleRename}
                            onDelete={handleDelete}
                            isMobile={isMobile}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </>
                    )}

                    {groupedChats.yesterday.length > 0 && (
                      <>
                        <div className="text-sidebar-foreground/50 mt-3 px-2 py-1 text-xs">
                          Yesterday
                        </div>
                        {groupedChats.yesterday.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            isFavorite={false}
                            onFavorite={handleAdd}
                            onRename={handleRename}
                            onDelete={handleDelete}
                            isMobile={isMobile}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </>
                    )}

                    {groupedChats.lastWeek.length > 0 && (
                      <>
                        <div className="text-sidebar-foreground/50 mt-3 px-2 py-1 text-xs">
                          Last 7 days
                        </div>
                        {groupedChats.lastWeek.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            isFavorite={false}
                            onFavorite={handleAdd}
                            onRename={handleRename}
                            onDelete={handleDelete}
                            isMobile={isMobile}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </>
                    )}

                    {groupedChats.lastMonth.length > 0 && (
                      <>
                        <div className="text-sidebar-foreground/50 mt-3 px-2 py-1 text-xs">
                          Last 30 days
                        </div>
                        {groupedChats.lastMonth.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            isFavorite={false}
                            onFavorite={handleAdd}
                            onRename={handleRename}
                            onDelete={handleDelete}
                            isMobile={isMobile}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </>
                    )}

                    {groupedChats.older.length > 0 && (
                      <>
                        <div className="text-sidebar-foreground/50 mt-3 px-2 py-1 text-xs">
                          Older
                        </div>
                        {groupedChats.older.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            isFavorite={false}
                            onFavorite={handleAdd}
                            onRename={handleRename}
                            onDelete={handleDelete}
                            isMobile={isMobile}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </>
                    )}
                  </>
                );
              })()}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      {hasNextPageChats && (
        <div ref={inViewRef} className="flex h-8 items-center justify-center">
          {isFetchingNextPageChats && (
            <Loader2 className="size-4 animate-spin" />
          )}
        </div>
      )}
    </>
  );
}
