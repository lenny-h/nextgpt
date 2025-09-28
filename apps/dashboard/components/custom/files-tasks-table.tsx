"use client";

import { useInfiniteQueryWithRPC } from "@/hooks/use-infinite-query";
import { type Locale } from "@/i18n.config";
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
import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { InfiniteDataTable } from "../tables/infinite-data-table";

interface Props<T> {
  locale: Locale;
  resourceName: "files" | "tasks";
  resourceProcedure: "get_course_files" | "get_course_tasks";
  columns: any[];
  visibilityState: Record<string, boolean>;
  filterLabel: string;
  filterColumn: string;
}

export const FilesTasksTable = <T extends object>({
  locale,
  resourceName,
  resourceProcedure,
  columns,
  visibilityState,
  filterLabel,
  filterColumn,
}: Props<T>) => {
  const [coursesPopoverOpen, setCoursesPopoverOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  const {
    data: courses,
    isPending: coursesPending,
    error: coursesError,
    hasNextPage: hasNextCoursesPage,
    isFetchingNextPage: isFetchingNextCoursesPage,
    inViewRef,
  } = useInfiniteQueryWithRPC({
    queryKey: ["courses"],
    procedure: "get_maintained_courses",
  });

  const {
    data: resources,
    isPending: resourcesPending,
    error: resourcesError,
    fetchNextPage: fetchNextResources,
    hasNextPage: hasNextResourcesPage,
    isFetchingNextPage: isFetchingNextResourcesPage,
    isFetching: resourcesFetching,
  } = useInfiniteQueryWithRPC({
    queryKey: [resourceName, selectedCourseId],
    procedure: resourceProcedure,
    params: { p_course_id: selectedCourseId },
    enabled: !!selectedCourseId,
  });

  if (coursesPending) {
    return (
      <div className="flex h-3/5 flex-col items-center justify-center space-y-8 p-2">
        <h1 className="text-2xl font-semibold">Loading courses...</h1>
        <Skeleton className="mx-auto h-96 w-full max-w-4xl" />
      </div>
    );
  }

  if (coursesError || !courses) {
    return (
      <div className="flex h-3/5 flex-col items-center justify-center space-y-8 p-2">
        <h1 className="text-center text-2xl font-semibold">
          Courses could not be loaded. Please try again later.
        </h1>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="flex h-3/5 flex-col items-center justify-center space-y-8 p-2">
        <h1 className="text-center text-2xl font-semibold">
          Looks like there are no courses yet
        </h1>
        <Button asChild>
          <Link href={`/${locale}/courses/new`}>Create a course</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 p-2">
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
      {!selectedCourseId ? (
        <div className="mt-8 text-center text-lg font-semibold">
          Please select a course to view {resourceName}
        </div>
      ) : resourcesPending ? (
        <Skeleton className="mx-auto h-96 w-full max-w-4xl rounded-md" />
      ) : resourcesError ? (
        <h1 className="mt-8 text-center text-2xl font-semibold">
          Could not fetch the {resourceName} of this course. Please try again
          later.
        </h1>
      ) : (
        <InfiniteDataTable
          columns={columns}
          data={resources}
          hasNextPage={hasNextResourcesPage}
          isFetching={isFetchingNextResourcesPage}
          fetchNextPage={fetchNextResources}
          visibilityState={visibilityState}
          filterLabel={filterLabel}
          filterColumn={filterColumn}
          queryKey={[resourceName, selectedCourseId]}
          isRefreshing={resourcesFetching}
        />
      )}
    </div>
  );
};
