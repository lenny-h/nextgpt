"use client";

import { useGlobalTranslations } from "@/contexts/global-translations";
import { useInfiniteQueryWithRPC } from "@/hooks/use-infinite-query";
import { type Locale } from "@/i18n.config";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import Link from "next/link";
import { coursesColumns } from "../tables/courses-columns";
import { InfiniteDataTable } from "../tables/infinite-data-table";

interface Props {
  locale: Locale;
}

export const Courses = ({ locale }: Props) => {
  const { globalT } = useGlobalTranslations();

  const {
    data: courses,
    isPending,
    error: coursesError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQueryWithRPC({
    queryKey: ["courses"],
    procedure: "get_maintained_courses",
  });

  if (isPending) {
    return (
      <div className="flex h-3/5 flex-col items-center justify-center space-y-8 p-2">
        <h1 className="text-2xl font-semibold">
          {globalT.components.courses.loading}
        </h1>
        <Skeleton className="mx-auto h-96 w-full max-w-4xl rounded-md" />
      </div>
    );
  }

  if (coursesError || !courses) {
    return (
      <div className="flex h-3/5 flex-col items-center justify-center space-y-8 p-2">
        <h1 className="text-center text-2xl font-semibold">
          {globalT.components.courses.errorLoading}
        </h1>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="flex h-3/5 flex-col items-center justify-center space-y-8 p-2">
        <h1 className="text-center text-2xl font-semibold">
          {globalT.components.courses.noCourses}
        </h1>
        <Button asChild>
          <Link href={`/${locale}/courses/new`}>
            {globalT.components.courses.createCourse}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 p-2">
      <h1 className="text-2xl font-semibold">
        {globalT.components.courses.title}
      </h1>
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
          bucket_id: false,
          bucket_name: true,
          created_at: true,
          private: true,
        }}
        filterLabel={globalT.components.courses.filterLabel}
        filterColumn="name"
      />
    </div>
  );
};
