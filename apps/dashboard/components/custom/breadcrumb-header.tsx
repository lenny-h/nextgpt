"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb";
import { Separator } from "@workspace/ui/components/separator";
import { SidebarTrigger } from "@workspace/ui/components/sidebar-left";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { usePathname } from "next/navigation";
import { memo } from "react";

export const BreadcrumbHeader = memo(() => {
  const { locale } = useSharedTranslations();

  const pathname = usePathname();
  const paths = pathname.split("/").filter((path) => path !== "");

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {paths[1] && (
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/${locale}/${paths[1]}`}>
                  {paths[1].charAt(0).toUpperCase() + paths[1].slice(1)}
                </BreadcrumbLink>
              </BreadcrumbItem>
            )}
            {paths[2] && (
              <>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {paths[2].charAt(0).toUpperCase() + paths[2].slice(1)}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
});
