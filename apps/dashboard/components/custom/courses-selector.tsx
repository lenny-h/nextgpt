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
import { cn } from "@workspace/ui/lib/utils";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type Dispatch, memo, type SetStateAction, useEffect, useState } from "react";

interface CourseSelectorProps {
  resourceName: "files" | "tasks";
  selectedCourseId: string;
  setSelectedCourseId: Dispatch<SetStateAction<string>>;
  courses: Course[];
  hasNextCoursesPage: boolean;
  isFetchingNextCoursesPage: boolean;
  inViewRef: (node?: Element | null | undefined) => void;
}

export const CoursesSelector = memo(
  ({
    resourceName,
    selectedCourseId,
    setSelectedCourseId,
    courses,
    hasNextCoursesPage,
    isFetchingNextCoursesPage,
    inViewRef,
  }: CourseSelectorProps) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [coursesPopoverOpen, setCoursesPopoverOpen] = useState(false);

    // Initialize selected course from URL on mount
    useEffect(() => {
      const courseIdFromUrl = searchParams.get("courseId");
      if (courseIdFromUrl) {
        const courseExists = courses.some((c) => c.id === courseIdFromUrl);
        if (courseExists) {
          setSelectedCourseId(courseIdFromUrl);
        }
      }
    }, [searchParams, selectedCourseId, courses, setSelectedCourseId]);

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
                  ? courses.find((c) => c.id === selectedCourseId)?.name
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
                  {courses.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={c.id}
                      onSelect={(currentValue) => {
                        const newCourseId = currentValue === selectedCourseId ? "" : currentValue;
                        setSelectedCourseId(newCourseId);
                        setCoursesPopoverOpen(false);
                        
                        // Update URL with courseId search parameter
                        const params = new URLSearchParams(searchParams);
                        if (newCourseId) {
                          params.set("courseId", newCourseId);
                        } else {
                          params.delete("courseId");
                        }
                        router.push(`${pathname}?${params.toString()}`);
                      }}
                    >
                      {c.name}
                      <Check
                        className={cn(
                          "ml-auto",
                          selectedCourseId === c.id
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
