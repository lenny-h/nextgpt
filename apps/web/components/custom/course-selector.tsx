"use client";

import { useFilter } from "@/contexts/filter-context";
import { useWebTranslations } from "@/contexts/web-translations";
import { CourseAccessCache } from "@/lib/course-access-cache";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";
import { memo, useCallback, useEffect, useState } from "react";
import { CourseKeyDialog } from "./course-key-dialog";
import { CoursesList } from "./courses-list";
import { SearchWithSelection } from "./search-with-selection";

interface SelectedCourseType {
  id: string;
  name: string;
  private: boolean;
}

export const CourseSelector = memo(() => {
  const { isLoading, isError, filter, setFilter } = useFilter();
  const { webT } = useWebTranslations();

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] =
    useState<SelectedCourseType | null>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "b" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  const addCourseToFilter = useCallback(
    (course: SelectedCourseType) => {
      const newFilter = {
        ...filter,
        courses: [...filter.courses, course],
      };
      setFilter(newFilter);

      CourseAccessCache.set(course.id, true);
    },
    [filter, setFilter],
  );

  const handleKeyDialogSuccess = useCallback(() => {
    if (selectedCourse) {
      addCourseToFilter(selectedCourse);
    }
    setSelectedCourse(null);
    setKeyDialogOpen(false);
  }, [addCourseToFilter, selectedCourse]);

  if (isLoading) {
    return <Skeleton className="h-9 w-40 rounded-xl" />;
  }

  if (isError || !filter.bucket.id) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            className={cn(
              "rounded-xl",
              filter.courses.length === 0
                ? "border-red-500"
                : "border-green-500",
            )}
            onClick={() => setOpen((open) => !open)}
            variant="outline"
          >
            {webT.courseSelector.coursesSelected.replace('{count}', filter.courses.length.toString())}
            <kbd className="bg-muted text-muted-foreground inline-flex h-5 items-center gap-1 rounded-xl border px-1.5 font-mono font-medium">
              <span className="text-xs">⌘</span>b
            </kbd>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{webT.courseSelector.searchCourses}</DialogTitle>
          </DialogHeader>
          <SearchWithSelection
            type="courses"
            inputValue={inputValue}
            onInputChange={(value) => setInputValue(value)}
          />
          <CoursesList
            open={open}
            inputValue={inputValue}
            max={5}
            onShowKeyDialog={(course) => {
              setSelectedCourse(course);
              setOpen(false); // Close the main dialog
              setKeyDialogOpen(true);
            }}
            onAddCourseToFilter={addCourseToFilter}
          />
        </DialogContent>
      </Dialog>

      {selectedCourse && (
        <CourseKeyDialog
          open={keyDialogOpen}
          onOpenChange={setKeyDialogOpen}
          courseId={selectedCourse.id}
          courseName={selectedCourse.name}
          onSuccess={handleKeyDialogSuccess}
        />
      )}
    </>
  );
});
