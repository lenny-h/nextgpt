import { Course } from "@workspace/server/drizzle/schema";
import { Button } from "@workspace/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { useInfiniteQueryWithRPC } from "@workspace/ui/hooks/use-infinite-query";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { cn } from "@workspace/ui/lib/utils";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { type Dispatch, memo, type SetStateAction, useState } from "react";

interface CourseSelectorProps {
  resourceName: "files" | "tasks";
  selectedCourseId: string;
  setSelectedCourseId: Dispatch<SetStateAction<string>>;
  courses: Course[];
  hasNextCoursesPage: boolean;
  isFetchingNextCoursesPage: boolean;
  inViewRef: (node?: Element | null | undefined) => void;
}

export const CourseSelector = memo(
  ({
    resourceName,
    selectedCourseId,
    setSelectedCourseId,
    courses,
    hasNextCoursesPage,
    isFetchingNextCoursesPage,
    inViewRef,
  }: CourseSelectorProps) => {
    const [coursesPopoverOpen, setCoursesPopoverOpen] = useState(false);

    return (
      <div className="flex items-center space-x-2">
        <h1 className="text-2xl font-semibold">
          {resourceName.charAt(0).toUpperCase() + resourceName.slice(1)} for
          course{" "}
        </h1>
        <Popover open={coursesPopoverOpen} onOpenChange={setCoursesPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={coursesPopoverOpen}
              className="flex w-[200px]"
            >
              <p className="flex-1 truncate text-left">
                {selectedCourseId
                  ? courses.find((course) => course.id === selectedCourseId)
                      ?.name
                  : "Select course..."}
              </p>
              <ChevronsUpDown className="opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search courses..." className="h-9" />
              <CommandList>
                <CommandEmpty>No course found</CommandEmpty>
                <CommandGroup>
                  {courses.map((course) => (
                    <CommandItem
                      key={course.id}
                      value={course.id}
                      onSelect={(currentValue) => {
                        setSelectedCourseId(
                          currentValue === selectedCourseId ? "" : currentValue,
                        );
                        setCoursesPopoverOpen(false);
                      }}
                    >
                      {course.name}
                      <Check
                        className={cn(
                          "ml-auto",
                          selectedCourseId === course.id
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  ))}
                  {hasNextCoursesPage && (
                    <div
                      ref={inViewRef}
                      className="flex h-8 items-center justify-center"
                    >
                      {isFetchingNextCoursesPage && (
                        <Loader2 className="size-4 animate-spin" />
                      )}
                    </div>
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  },
);
