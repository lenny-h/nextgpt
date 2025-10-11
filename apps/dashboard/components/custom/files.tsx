"use client";

import { type Locale } from "@workspace/ui/lib/i18n.config";

import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { useInfiniteQueryWithRPC } from "@workspace/ui/hooks/use-infinite-query";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import Link from "next/link";
import { useState } from "react";
import { filesColumns } from "../tables/files-columns";
import { InfiniteDataTable } from "../tables/infinite-data-table";
import { CourseSelector } from "./courses-selector";

interface Props {
  locale: Locale;
}

export const Files = ({ locale }: Props) => {
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
          client.courses.maintained.$get({
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
    data: filesData,
    isPending: filesPending,
    error: filesError,
    fetchNextPage: fetchNextFiles,
    hasNextPage: hasNextFilesPage,
    isFetchingNextPage: isFetchingNextFilesPage,
    isFetching: filesFetching,
  } = useInfiniteQueryWithRPC({
    queryKey: ["files", selectedCourseId],
    queryFn: ({ pageParam }) =>
      apiFetcher(
        (client) =>
          client["files"][":courseId"].$get({
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

  const files = filesData?.items;

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
        resourceName={"files"}
        selectedCourseId={selectedCourseId}
        setSelectedCourseId={setSelectedCourseId}
        courses={courses}
        hasNextCoursesPage={hasNextCoursesPage}
        isFetchingNextCoursesPage={isFetchingNextCoursesPage}
        inViewRef={inViewRef}
      />
      {!selectedCourseId ? (
        <div className="mt-8 text-center text-lg font-semibold">
          Please select a course to view its files
        </div>
      ) : filesPending ? (
        <Skeleton className="mx-auto h-96 w-full max-w-4xl rounded-md" />
      ) : filesError ? (
        <h1 className="mt-8 text-center text-2xl font-semibold">
          Could not fetch the files of this course. Please try again later.
        </h1>
      ) : (
        <InfiniteDataTable
          columns={filesColumns}
          data={files}
          hasNextPage={hasNextFilesPage}
          isFetching={isFetchingNextFilesPage}
          fetchNextPage={fetchNextFiles}
          visibilityState={{
            id: false,
            name: true,
            size: true,
            createdAt: true,
          }}
          filterLabel={"file name"}
          filterColumn={"name"}
          queryKey={["files", selectedCourseId]}
          isRefreshing={filesFetching}
        />
      )}
    </div>
  );
};
