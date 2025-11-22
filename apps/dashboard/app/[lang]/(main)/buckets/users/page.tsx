"use client";

import { AddBucketUsers } from "@/components/custom/add-bucket-users";
import { CurrentBucketUsers } from "@/components/custom/current-bucket-users";
import { RemoveBucketUsers } from "@/components/custom/remove-bucket-users";
import { useQuery } from "@tanstack/react-query";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { useUser } from "@workspace/ui/contexts/user-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { notFound, useSearchParams } from "next/navigation";

export default function BucketUsersPage() {
  const { sharedT } = useSharedTranslations();

  const user = useUser();

  const searchParams = useSearchParams();
  const bucketId = searchParams.get("bucketId");
  const bucketName = searchParams.get("bucketName");

  const {
    data: currentBucketUsers,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["bucket_users", bucketId],
    queryFn: () =>
      apiFetcher(
        (client) =>
          client["bucket-users"][":bucketId"].$get({
            param: { bucketId: bucketId as string },
            query: {
              pageNumber: "0",
              itemsPerPage: "10",
            },
          }),
        sharedT.apiCodes,
      ),
    enabled: !!bucketId,
  });

  // Fetch user count for the bucket
  const {
    data: userCountData,
    isPending: isUserCountPending,
    isError: isUserCountError,
  } = useQuery({
    queryKey: ["user-count", bucketId],
    queryFn: () =>
      apiFetcher(
        (client) =>
          client["buckets"][":bucketId"]["user-count"].$get({
            param: { bucketId: bucketId as string },
          }),
        sharedT.apiCodes,
      ),
    enabled: !!bucketId,
  });

  const userCount = userCountData?.userCount;

  if (!bucketId || !bucketName) {
    notFound();
  }

  if (isPending || isUserCountPending) {
    return (
      <div className="flex h-3/5 flex-col items-center justify-center space-y-8 p-2">
        <h1 className="text-2xl font-semibold">Loading bucket users...</h1>
      </div>
    );
  }

  if (isError || !currentBucketUsers || isUserCountError || !userCount) {
    return (
      <div className="flex h-3/5 flex-col items-center justify-center space-y-8 p-2">
        <h1 className="text-2xl font-semibold">
          Bucket users could not be loaded. Please try again later.
        </h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 p-4">
      <h1 className="text-2xl font-semibold">{bucketName}</h1>
      <div className="w-full max-w-4xl space-y-6">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Current Users ({userCount})</h2>
          <CurrentBucketUsers
            currentUser={user}
            currentBucketUsers={currentBucketUsers}
            userCount={userCount}
          />
        </div>
        <div className="space-y-3">
          <div className="max-w-lg">
            <h2 className="text-xl font-semibold">Add users</h2>
            <p className="text-muted-foreground text-sm">
              Add users to give them access to this bucket. Users will be able
              to access all courses within this bucket that are not password
              protected.
            </p>
          </div>
          <AddBucketUsers bucketId={bucketId} />
        </div>
        <div className="space-y-3">
          <div className="max-w-lg">
            <h2 className="text-xl font-semibold">Remove users</h2>
            <p className="text-muted-foreground text-sm">
              Remove users from this bucket. They will lose access to all
              courses within this bucket. The removal can be delayed by up to 3
              days due to caching.
            </p>
          </div>
          <RemoveBucketUsers bucketId={bucketId} />
        </div>
      </div>
    </div>
  );
}
