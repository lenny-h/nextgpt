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
import { CourseSelector } from "./courses-selector";

interface Props<T> {
  locale: Locale;
  resourceName: "files" | "tasks";
  resourceFetcher: ({ pageParam }: { pageParam?: number }) => Promise<T>;
  columns: any[];
  visibilityState: Record<string, boolean>;
  filterLabel: string;
  filterColumn: string;
}

export const FilesTasksTable = <T extends object>({
  locale,
  resourceName,
  resourceFetcher,
  columns,
  visibilityState,
  filterLabel,
  filterColumn,
}: Props<T>) => {
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
            query: { pageNumber: (pageParam ?? 0).toString() },
          }),
        sharedT.apiCodes,
      ),
  });

  const courses = coursesData?.maintainedCourses;

  const {
    data: resourcesData,
    isPending: resourcesPending,
    error: resourcesError,
    fetchNextPage: fetchNextResources,
    hasNextPage: hasNextResourcesPage,
    isFetchingNextPage: isFetchingNextResourcesPage,
    isFetching: resourcesFetching,
  } = useInfiniteQueryWithRPC({
    queryKey: [resourceName, selectedCourseId],
    queryFn: resourceFetcher,
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
      <CourseSelector
        resourceName={resourceName}
        selectedCourseId={selectedCourseId}
        setSelectedCourseId={setSelectedCourseId}
        courses={courses}
        hasNextCoursesPage={hasNextCoursesPage}
        isFetchingNextCoursesPage={isFetchingNextCoursesPage}
        inViewRef={inViewRef}
      />
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
