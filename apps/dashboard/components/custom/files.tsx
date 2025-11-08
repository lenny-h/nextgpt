"use client";

import { type Locale } from "@workspace/ui/lib/i18n.config";

import { useDashboardTranslations } from "@/contexts/dashboard-translations";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { useInfiniteQueryWithRPC } from "@workspace/ui/hooks/use-infinite-query";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import Link from "next/link";
import { useState } from "react";
import { filesColumns } from "../tables/files-columns";
import { InfiniteDataTable } from "../tables/infinite-data-table";
import { CoursesSelector } from "./courses-selector";

interface Props {
  locale: Locale;
}

export const Files = ({ locale }: Props) => {
  const { sharedT } = useSharedTranslations();
  const { dashboardT } = useDashboardTranslations();

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

  const courses = coursesData?.map((c) => ({
    ...c,
    createdAt: new Date(c.createdAt),
  }));

  const {
    data: files,
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

  if (coursesPending) {
    return (
      <div className="flex h-3/5 flex-col items-center justify-center space-y-8 p-2">
        <h1 className="text-2xl font-semibold">{dashboardT.courses.loading}</h1>
        <Skeleton className="mx-auto h-96 w-full max-w-4xl" />
      </div>
    );
  }

  if (coursesError || !courses) {
    return (
      <div className="flex h-3/5 flex-col items-center justify-center space-y-8 p-2">
        <h1 className="text-muted-foreground text-center text-xl font-medium">
          {dashboardT.courses.errorLoading}
        </h1>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="flex h-3/5 flex-col items-center justify-center space-y-8 p-2">
        <h1 className="text-muted-foreground text-center text-xl font-medium">
          {dashboardT.files.noCourses}
        </h1>
        <Button asChild>
          <Link href={`/${locale}/courses/new`}>
            {dashboardT.courses.createCourse}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 p-2">
      <CoursesSelector
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
          {dashboardT.files.selectCourse}
        </div>
      ) : filesPending ? (
        <Skeleton className="mx-auto h-96 w-full max-w-4xl rounded-md" />
      ) : filesError || !files ? (
        <h1 className="mt-8 text-center text-2xl font-semibold">
          {dashboardT.files.errorLoading}
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
