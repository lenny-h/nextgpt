"use client";

import { memo } from "react";

import { useRefs } from "@/contexts/refs-context";
import { useIsTemporary } from "@/contexts/temporary-chat-context";
import { removeFromInfiniteCache, rpcFetcher } from "@/lib/fetcher";
import { createClient } from "@/lib/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { SidebarTrigger } from "@workspace/ui/components/sidebar-left";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { resizeEditor } from "@workspace/ui/lib/utils";
import { PanelRightIcon, Star } from "lucide-react";
import { toast } from "sonner";
import { CourseSelector } from "./course-selector";
import { useGlobalTranslations } from "@/contexts/global-translations";

interface Props {
  chatId: string;
  isEmpty: boolean;
}

export const ChatHeader = memo(({ chatId, isEmpty }: Props) => {
  const queryClient = useQueryClient();
  const { globalT } = useGlobalTranslations();

  const { panelRef } = useRefs();
  const [isTemporary] = useIsTemporary();

  const { data: titleData, isLoading: titleIsLoading } = useQuery({
    queryKey: ["chatTitle", chatId],
    queryFn: () => rpcFetcher("get_chat_title", { p_chat_id: chatId }),
    enabled: !isEmpty && !isTemporary,
  });

  const { data: favouritesData } = useQuery({
    queryKey: ["liked", chatId],
    queryFn: () => rpcFetcher("get_is_favourite", { p_chat_id: chatId }),
    enabled: !isEmpty && !isTemporary,
  });

  const updateChat = async (chatId: string, isFavourite: boolean) => {
    const supabase = createClient();

    const { error } = await supabase.rpc("set_is_favourite", {
      p_chat_id: chatId,
      p_is_favourite: isFavourite,
    });

    if (error) {
      throw new Error("Failed to update chat");
    }

    queryClient.setQueryData(
      ["liked", chatId],
      [{ is_favourite: isFavourite }],
    );
  };

  const handleAdd = async (chatId: string) => {
    toast.promise(updateChat(chatId, true), {
      loading: "Adding chat to favorites...",
      success: () => {
        queryClient.invalidateQueries({ queryKey: ["favourites"] });

        return globalT.components.chatHeader.chatAdded;
      },
      error: globalT.components.chatHeader.chatAddedError,
    });
  };

  const handleRemove = async (chatId: string) => {
    toast.promise(updateChat(chatId, false), {
      loading: "Removing chat from favorites...",
      success: () => {
        removeFromInfiniteCache(queryClient, ["favourites"], chatId);

        return globalT.components.chatHeader.chatRemoved;
      },
      error: globalT.components.chatHeader.chatRemovedError,
    });
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-3 transition-[width,height] ease-linear">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger />
        {!isEmpty &&
          !isTemporary &&
          (titleIsLoading ? (
            <Skeleton className="h-6 w-44" />
          ) : (
            <h1 className="truncate text-lg font-semibold">
              {titleData?.[0]?.title || "Chat"}
            </h1>
          ))}
      </div>
      <div className="flex items-center gap-2">
        <CourseSelector />

        {!isEmpty && !isTemporary && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => {
                  if (favouritesData?.[0]?.is_favourite) {
                    handleRemove(chatId);
                  } else {
                    handleAdd(chatId);
                  }
                }}
              >
                <Star
                  className={
                    favouritesData?.[0]?.is_favourite
                      ? "text-primary fill-current"
                      : "none"
                  }
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {globalT.components.chatHeader.addToFavourites}
            </TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => {
                resizeEditor(panelRef, true);
              }}
            >
              <PanelRightIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {globalT.components.chatHeader.toggleSidebar}
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
});
