"use client";

import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { useInfiniteQueryWithRPC } from "@workspace/ui/hooks/use-infinite-query";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { type Locale } from "@workspace/ui/lib/i18n.config";
import Link from "next/link";
import { useState } from "react";
import { InfiniteDataTable } from "../tables/infinite-data-table";
import { tasksColumns } from "../tables/tasks-columns";
import { CourseSelector } from "./courses-selector";

interface Props {
  locale: Locale;
}

export const Tasks = ({ locale }: Props) => {
  const { sharedT } = useSharedTranslations();

  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  const {
    data: coursesData,
    isPending: coursesPending,
    error: coursesError,
    hasNextPage: hasNextCoursesPage,
    isFetchingNextPage: isFetchingNextCoursesPage,
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

  const courses = coursesData?.items.map((c) => ({
    ...c,
    createdAt: new Date(c.createdAt),
  }));

  const {
    data: tasksData,
    isPending: tasksPending,
    error: tasksError,
    fetchNextPage: fetchNextTasks,
    hasNextPage: hasNextTasksPage,
    isFetchingNextPage: isFetchingNextTasksPage,
    isFetching: tasksFetching,
  } = useInfiniteQueryWithRPC({
    queryKey: ["tasks", selectedCourseId],
    queryFn: ({ pageParam }) =>
      apiFetcher(
        (client) =>
          client.tasks[":courseId"].$get({
            param: { courseId: selectedCourseId },
            query: {
              pageNumber: (pageParam ?? 0).toString(),
              itemsPerPage: "10",
            },
          }),
        sharedT.apiCodes,
      ),
    enabled: !!selectedCourseId,
  });

  const tasks = tasksData?.items.map((task) => ({
    ...task,
    pubDate: task.pubDate ?? "",
  }));

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
        <h1 className="text-muted-foreground text-center text-xl font-medium">
          Courses could not be loaded. Please try again later.
        </h1>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="flex h-3/5 flex-col items-center justify-center space-y-8 p-2">
        <h1 className="text-muted-foreground text-center text-xl font-medium">
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
      <CourseSelector
        resourceName={"tasks"}
        selectedCourseId={selectedCourseId}
        setSelectedCourseId={setSelectedCourseId}
        courses={courses}
        hasNextCoursesPage={hasNextCoursesPage}
        isFetchingNextCoursesPage={isFetchingNextCoursesPage}
        inViewRef={inViewRef}
      />
      {!selectedCourseId ? (
        <div className="mt-8 text-center text-lg font-semibold">
          Please select a course to view its tasks
        </div>
      ) : tasksPending ? (
        <Skeleton className="mx-auto h-96 w-full max-w-4xl rounded-md" />
      ) : tasksError || !tasks ? (
        <h1 className="mt-8 text-center text-2xl font-semibold">
          Could not fetch the tasks of this course. Please try again later.
        </h1>
      ) : (
        <InfiniteDataTable
          columns={tasksColumns}
          data={tasks}
          hasNextPage={hasNextTasksPage}
          isFetching={isFetchingNextTasksPage}
          fetchNextPage={fetchNextTasks}
          visibilityState={{
            id: false,
            name: true,
            status: true,
            createdAt: true,
            pubDate: true,
          }}
          filterLabel={"task name"}
          filterColumn={"name"}
          queryKey={["tasks", selectedCourseId]}
          isRefreshing={tasksFetching}
        />
      )}
    </div>
  );
};
