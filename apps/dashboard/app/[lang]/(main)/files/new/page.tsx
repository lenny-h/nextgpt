"use client";

import { Dropzone } from "@/components/custom/dropzone";
import { Button } from "@workspace/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import { DatePicker } from "@workspace/ui/components/date-picker";
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
import { useState } from "react";

export default function UploadFilesPage() {
  const { sharedT } = useSharedTranslations();

  const [value, setValue] = useState("");
  const [coursesPopoverOpen, setCoursesPopoverOpen] = useState(false);
  const [processingDate, setProcessingDate] = useState<Date | undefined>(
    undefined,
  );

  const {
    data: coursesData,
    isPending,
    error: coursesError,
    hasNextPage,
    isFetchingNextPage,
    inViewRef,
  } = useInfiniteQueryWithRPC({
    queryKey: ["courses"],
    queryFn: ({ pageParam }) =>
      apiFetcher(
        (client) =>
          client["courses"]["maintained"].$get({
            query: {
              pageNumber: (pageParam ?? 0).toString(),
              itemsPerPage: "10",
            },
          }),
        sharedT.apiCodes,
      ),
  });

  const courses = coursesData.items;

  if (isPending) {
    return (
      <div className="flex h-3/5 flex-col items-center justify-center space-y-8 p-2">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (coursesError || !courses) {
    return (
      <div className="flex h-3/5 flex-col items-center justify-center space-y-8 p-2">
        <h1 className="text-2xl font-semibold">
          There was an error loading the courses. Please try again later.
        </h1>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center space-y-6 px-8 py-2">
      <h1 className="text-2xl font-semibold">Upload course content</h1>
      <Popover open={coursesPopoverOpen} onOpenChange={setCoursesPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={coursesPopoverOpen}
            className="flex w-[200px]"
          >
            <p className="flex-1 truncate text-left">
              {value
                ? courses.find((course) => course.id === value)?.name
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
                      setValue(currentValue === value ? "" : currentValue);
                      setCoursesPopoverOpen(false);
                    }}
                  >
                    {course.name}
                    <Check
                      className={cn(
                        "ml-auto",
                        value === course.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
                {hasNextPage && (
                  <div
                    ref={inViewRef}
                    className="flex h-8 items-center justify-center"
                  >
                    {isFetchingNextPage && (
                      <Loader2 className="size-4 animate-spin" />
                    )}
                  </div>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <div className="flex flex-row items-center gap-4">
        <h2 className="text-muted-foreground">Processing date (Optional):</h2>
        <DatePicker
          date={processingDate}
          onSelect={setProcessingDate}
          placeholder="Select a processing date"
          disabled={!value}
        />
      </div>

      <Dropzone courseId={value} processingDate={processingDate} />
    </div>
  );
}
