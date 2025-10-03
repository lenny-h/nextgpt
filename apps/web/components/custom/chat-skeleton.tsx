"use client";

import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";
import { memo } from "react";

export const ChatSkeleton = memo(() => {
  return (
    <div className="animate-in fade-in-0 flex h-dvh flex-col duration-300">
      {/* Header skeleton */}
      <div className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
        <div className="flex h-14 items-center gap-2 px-4">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-6 max-w-xs flex-1" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      </div>

      {/* Messages area skeleton */}
      <div className="flex-1 overflow-y-scroll px-2 py-3 sm:px-4 md:px-6">
        <div className="flex flex-col gap-4">
          {/* Multiple message skeletons with staggered animations */}
          <MessageSkeleton type="user" animationDelay={100} />
          <MessageSkeleton type="agent" animationDelay={200} />
          <MessageSkeleton type="user" animationDelay={300} />
          <MessageSkeleton type="agent" isLonger animationDelay={400} />
        </div>
      </div>

      {/* Input form skeleton */}
      <div className="mx-auto w-full -translate-y-1 sm:px-4 sm:pb-4 md:max-w-3xl md:px-6 md:pb-6">
        <div className="bg-background border-border rounded-2xl border p-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
});

const MessageSkeleton = memo(
  ({
    type,
    isLonger = false,
    animationDelay = 0,
  }: {
    type: "user" | "agent";
    isLonger?: boolean;
    animationDelay?: number;
  }) => {
    const isUser = type === "user";

    return (
      <div
        className={cn(
          "animate-in fade-in-0 slide-in-from-bottom-2 flex gap-3 duration-500",
          isUser ? "justify-end" : "justify-start",
        )}
        style={{
          animationDelay: `${animationDelay}ms`,
          animationFillMode: "both",
        }}
      >
        {!isUser && <Skeleton className="h-8 w-8 flex-shrink-0 rounded-full" />}

        <div
          className={cn(
            "flex max-w-[80%] flex-col gap-2",
            isUser ? "items-end" : "items-start",
          )}
        >
          <div
            className={cn(
              "rounded-2xl p-3",
              isUser
                ? "bg-primary/10 border-primary/20 border"
                : "bg-muted border-border border",
            )}
          >
            <div className="space-y-2">
              <Skeleton className={cn("h-4", isLonger ? "w-80" : "w-60")} />
              <Skeleton className={cn("h-4", isLonger ? "w-72" : "w-48")} />
              {isLonger && (
                <>
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-56" />
                </>
              )}
            </div>
          </div>

          {!isUser && (
            <div className="flex gap-1">
              <Skeleton className="h-6 w-6 rounded-md" />
              <Skeleton className="h-6 w-6 rounded-md" />
              <Skeleton className="h-6 w-6 rounded-md" />
            </div>
          )}
        </div>

        {isUser && <Skeleton className="h-8 w-8 flex-shrink-0 rounded-full" />}
      </div>
    );
  },
);
