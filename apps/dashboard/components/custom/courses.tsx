"use client";

import { useDashboardTranslations } from "@/contexts/dashboard-translations";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { useInfiniteQueryWithRPC } from "@workspace/ui/hooks/use-infinite-query";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { type Locale } from "@workspace/ui/lib/i18n.config";
import Link from "next/link";
import { coursesColumns } from "../tables/courses-columns";
import { InfiniteDataTable } from "../tables/infinite-data-table";

interface Props {
  locale: Locale;
}

export const Courses = ({ locale }: Props) => {
  const { sharedT } = useSharedTranslations();
  const { dashboardT } = useDashboardTranslations();

  const {
    data: coursesData,
    isPending,
    error: coursesError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
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

  const courses = coursesData?.items;

  if (isPending) {
    return (
      <div className="flex h-3/5 flex-col items-center justify-center space-y-8 p-2">
        <h1 className="text-2xl font-semibold">{dashboardT.courses.loading}</h1>
        <Skeleton className="mx-auto h-96 w-full max-w-4xl rounded-md" />
      </div>
    );
  }

  if (coursesError || !courses) {
    return (
      <div className="flex h-3/5 flex-col items-center justify-center space-y-8 p-2">
        <h1 className="text-center text-2xl font-semibold">
          {dashboardT.courses.errorLoading}
        </h1>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="flex h-3/5 flex-col items-center justify-center space-y-8 p-2">
        <h1 className="text-center text-2xl font-semibold">
          {dashboardT.courses.noCourses}
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
      <h1 className="text-2xl font-semibold">{dashboardT.courses.title}</h1>
      <InfiniteDataTable
        columns={coursesColumns}
        data={courses}
        hasNextPage={hasNextPage}
        isFetching={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        visibilityState={{
          id: false,
          name: true,
          description: true,
          bucketId: false,
          bucketName: true,
          createdAt: true,
          private: true,
        }}
        filterLabel={dashboardT.courses.filterLabel}
        filterColumn="name"
      />
    </div>
  );
};
