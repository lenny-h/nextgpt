"use client";

import { useRefs } from "@/contexts/refs-context";
import { Button } from "@workspace/ui/components/button";
import { SidebarTrigger } from "@workspace/ui/components/sidebar-left";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { resizeEditor } from "@workspace/ui/lib/utils";
import { PanelRightIcon } from "lucide-react";
import { memo } from "react";
import { CourseSelector } from "./course-selector";

interface Props {
  showCourseSelector: boolean;
}

export const Header = memo(({ showCourseSelector }: Props) => {
  const { panelRef } = useRefs();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-3 transition-[width,height] ease-linear">
      <SidebarTrigger />
      <div className="flex items-center gap-2">
        {showCourseSelector && <CourseSelector />}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-muted-foreground/50 hidden h-8 w-8 md:flex"
              onClick={() => {
                resizeEditor(panelRef, true);
              }}
            >
              <PanelRightIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle sidebar</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
});
