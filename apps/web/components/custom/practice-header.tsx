import { useGlobalTranslations } from "@/contexts/web-translations";
import { useRefs } from "@/contexts/refs-context";
import { Button } from "@workspace/ui/components/button";
import { SidebarTrigger } from "@workspace/ui/components/sidebar-left";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { resizeEditor } from "@workspace/ui/lib/utils";
import { Eye, PanelRightIcon, TextCursorInput } from "lucide-react";
import { Dispatch, memo, SetStateAction } from "react";
import { CourseSelector } from "./course-selector";

interface Props {
  isEmpty: boolean;
  showTextArea: boolean;
  setShowTextArea: Dispatch<SetStateAction<boolean>>;
  showPreviousMessages: boolean;
  setShowPreviousMessages: Dispatch<SetStateAction<boolean>>;
}

export const PracticeHeader = memo(
  ({
    isEmpty,
    showTextArea,
    setShowTextArea,
    showPreviousMessages,
    setShowPreviousMessages,
  }: Props) => {
    const { globalT } = useGlobalTranslations();
    const { panelRef } = useRefs();

    return (
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-3 transition-[width,height] ease-linear">
        <SidebarTrigger />
        <div className="flex items-center gap-2">
          <CourseSelector />

          {!isEmpty && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => setShowPreviousMessages((prev) => !prev)}
                >
                  <Eye />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {showPreviousMessages
                  ? globalT.components.practiceHeader.hidePreviousQuestions
                  : globalT.components.practiceHeader.showPreviousQuestions}
              </TooltipContent>
            </Tooltip>
          )}
          {!isEmpty && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => setShowTextArea((prev) => !prev)}
                >
                  <TextCursorInput />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {showTextArea
                  ? globalT.components.practiceHeader.hideTextArea
                  : globalT.components.practiceHeader.showTextArea}
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
              {globalT.components.practiceHeader.toggleSidebar}
            </TooltipContent>
          </Tooltip>
        </div>
      </header>
    );
  },
);
