"use client";

import { useFilter } from "@/contexts/filter-context";
import {
  DropdownMenu,
  DropdownMenuContent,
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
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { ChevronsUpDown, Plus, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const BucketSwitcher = () => {
  const isMobile = useIsMobile();
  const { data, isLoading, isError, filter, setFilter } = useFilter();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg">
              <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                {isLoading ? (
                  <Skeleton className="size-4" />
                ) : isError || !data ? (
                  <X className="size-4" />
                ) : (
                  <Image
                    src="/android-chrome-192x192.png"
                    alt="NextGPT Logo"
                    width={40}
                    height={40}
                  />
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {isLoading
                    ? "Loading..."
                    : isError || !data
                      ? "An error occurred"
                      : data.length > 0
                        ? data.find(
                          (bucket) => bucket.bucketId === filter.bucket.id,
                        )?.name
                        : "No bucket"}
                </span>
                {!isLoading && !isError && data && data.length > 0 && (
                  <span className="truncate text-xs">
                    {
                      data.find(
                        (bucket) => bucket.bucketId === filter.bucket.id,
                      )?.type
                    }
                  </span>
                )}
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={9}
          >
            <DropdownMenuLabel className="text-muted-foreground text-sm">
              Buckets
            </DropdownMenuLabel>
            {data?.map((bucket) => (
              <DropdownMenuItem
                key={bucket.name}
                onClick={() =>
                  setFilter({
                    bucket: {
                      id: bucket.bucketId,
                    },
                    courses: [],
                    files: [],
                    documents: [],
                    prompts: [],
                  })
                }
                className="gap-2 p-2"
              >
                {bucket.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2" asChild>
              <Link href={process.env.NEXT_PUBLIC_DASHBOARD_URL!}>
                <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                  <Plus className="size-4" />
                </div>
                <span className="text-muted-foreground font-medium">
                  Add bucket
                </span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
