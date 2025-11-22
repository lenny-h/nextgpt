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

export default function BucketMaintainersPage() {
  const { sharedT } = useSharedTranslations();
  const { dashboardT } = useDashboardTranslations();
  const user = useUser();

  const searchParams = useSearchParams();
  const bucketId = searchParams.get("bucketId");
  const bucketName = searchParams.get("bucketName");

  if (!bucketId || !bucketName) {
    notFound();
  }

  const {
    data: currentMaintainers,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["bucket_maintainers", bucketId],
    queryFn: () =>
      apiFetcher(
        (client) =>
          client["bucket-maintainers"][":bucketId"].$get({
            param: { bucketId },
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
    <div className="flex flex-col items-center space-y-6 p-4">
      <h1 className="text-2xl font-semibold">{bucketName}</h1>
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
              {dashboardT.maintainers.addBucketMaintainersDescription}
            </p>
          </div>
          <AddMaintainers bucketId={bucketId} />
        </div>
        <div className="space-y-3">
          <div className="max-w-lg">
            <h2 className="text-xl font-semibold">
              {dashboardT.maintainers.removeMaintainers}
            </h2>
            <p className="text-muted-foreground text-sm">
              {dashboardT.maintainers.removeBucketMaintainersDescription}
            </p>
          </div>
          <RemoveMaintainers
            bucketId={bucketId}
            currentUser={user}
            currentMaintainers={currentMaintainers}
          />
        </div>
      </div>
    </div>
  );
}
