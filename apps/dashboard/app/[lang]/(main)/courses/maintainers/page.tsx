"use client";

import { AddMaintainers } from "@/components/custom/add-maintainers";
import { CurrentMaintainers } from "@/components/custom/current-maintainers";
import { RemoveMaintainers } from "@/components/custom/remove-maintainers";
import { useDashboardTranslations } from "@/contexts/dashboard-translations";
import { useQuery } from "@tanstack/react-query";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { useUser } from "@workspace/ui/contexts/user-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { notFound, useSearchParams } from "next/navigation";

export default function CourseMaintainersPage() {
  const { sharedT } = useSharedTranslations();
  const { dashboardT } = useDashboardTranslations();
  const user = useUser();

  const searchParams = useSearchParams();
  const bucketId = searchParams.get("bucketId");
  const courseId = searchParams.get("courseId");
  const courseName = searchParams.get("courseName");

  if (!bucketId || !courseId || !courseName) {
    notFound();
  }

  const {
    data: currentMaintainers,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["course_maintainers", courseId],
    queryFn: () =>
      apiFetcher(
        (client) =>
          client["course-maintainers"][":courseId"].$get({
            param: { courseId },
          }),
        sharedT.apiCodes,
      ),
  });

  if (isPending) {
    return (
      <div className="flex h-3/5 flex-col items-center justify-center space-y-8 p-2">
        <h1 className="text-2xl font-semibold">
          {dashboardT.maintainers.loading}
        </h1>
      </div>
    );
  }

  if (isError || !currentMaintainers) {
    return (
      <div className="flex h-3/5 flex-col items-center justify-center space-y-8 p-2">
        <h1 className="text-2xl font-semibold">
          {dashboardT.maintainers.errorLoading}
        </h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 p-2">
      <h1 className="text-2xl font-semibold">{courseName}</h1>
      <div className="w-full max-w-4xl space-y-6">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">
            {dashboardT.maintainers.currentMaintainers}
          </h2>
          <CurrentMaintainers
            currentUser={user}
            currentMaintainers={currentMaintainers}
          />
        </div>
        <div className="space-y-3">
          <div className="max-w-lg">
            <h2 className="text-xl font-semibold">
              {dashboardT.maintainers.addMaintainers}
            </h2>
            <p className="text-muted-foreground text-sm">
              {dashboardT.maintainers.addCourseMaintainersDescription}
            </p>
          </div>
          <AddMaintainers bucketId={bucketId} courseId={courseId} />
        </div>
        <div className="space-y-3">
          <div className="max-w-lg">
            <h2 className="text-xl font-semibold">
              {dashboardT.maintainers.removeMaintainers}
            </h2>
            <p className="text-muted-foreground text-sm">
              {dashboardT.maintainers.removeCourseMaintainersDescription}
            </p>
          </div>
          <RemoveMaintainers
            bucketId={bucketId}
            courseId={courseId}
            currentUser={user}
            currentMaintainers={currentMaintainers}
          />
        </div>
      </div>
    </div>
  );
}
