"use client";

import { useIsTemporary } from "@/contexts/temporary-chat-context";
import { useWebTranslations } from "@/contexts/web-translations";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { SidebarTrigger } from "@workspace/ui/components/sidebar-left";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { useRefs } from "@workspace/ui/contexts/refs-context";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher, removeFromInfiniteCache } from "@workspace/ui/lib/fetcher";
import { resizeEditor } from "@workspace/ui/lib/utils";
import { PanelRightIcon, Star } from "lucide-react";
import { memo } from "react";
import { toast } from "sonner";
import { CourseSelector } from "./course-selector";

interface ChatHeaderProps {
  chatId: string;
  isEmpty: boolean;
  isLoading: boolean;
  isNewChat?: boolean;
}

export const ChatHeader = memo(
  ({ chatId, isEmpty, isLoading, isNewChat = false }: ChatHeaderProps) => {
    const { sharedT } = useSharedTranslations();
    const { webT } = useWebTranslations();
    const queryClient = useQueryClient();

    const { panelRef } = useRefs();
    const [isTemporary] = useIsTemporary();

    const { data: titleData, isLoading: titleIsLoading } = useQuery({
      queryKey: ["chatTitle", chatId],
      queryFn: () =>
        apiFetcher(
          (client) =>
            client["chats"]["title"][":chatId"].$get({
              param: { chatId },
            }),
          sharedT.apiCodes,
        ),
      enabled: !isEmpty && !isTemporary && !isLoading && !isNewChat,
    });

    const { data: favouritesData } = useQuery({
      queryKey: ["liked", chatId],
      queryFn: () =>
        apiFetcher(
          (client) =>
            client["chats"]["is-favourite"][":chatId"].$get({
              param: { chatId },
            }),
          sharedT.apiCodes,
        ),
      enabled: !isEmpty && !isTemporary && !isLoading && !isNewChat,
    });

    const updateChat = async (chatId: string, isFavourite: boolean) => {
      await apiFetcher(
        (client) =>
          client.chats["is-favourite"][":chatId"].$patch({
            param: { chatId },
            json: { isFavourite },
          }),
        sharedT.apiCodes,
      );

      queryClient.setQueryData(["liked", chatId], { isFavourite });
    };

    const handleAdd = async (chatId: string) => {
      toast.promise(updateChat(chatId, true), {
        loading: "Adding chat to favorites...",
        success: () => {
          queryClient.invalidateQueries({ queryKey: ["favourites"] });

          return webT.chatHeader.chatAdded;
        },
        error: webT.chatHeader.chatAddedError,
      });
    };

    const handleRemove = async (chatId: string) => {
      toast.promise(updateChat(chatId, false), {
        loading: "Removing chat from favorites...",
        success: () => {
          removeFromInfiniteCache(queryClient, ["favourites"], chatId);

          return webT.chatHeader.chatRemoved;
        },
        error: webT.chatHeader.chatRemovedError,
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
                {titleData?.title || "Chat"}
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
                    if (favouritesData?.isFavourite) {
                      handleRemove(chatId);
                    } else {
                      handleAdd(chatId);
                    }
                  }}
                >
                  <Star
                    className={
                      favouritesData?.isFavourite
                        ? "text-primary fill-current"
                        : "none"
                    }
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{webT.chatHeader.addToFavourites}</TooltipContent>
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
            <TooltipContent>{webT.chatHeader.toggleSidebar}</TooltipContent>
          </Tooltip>
        </div>
      </header>
    );
  },
);
