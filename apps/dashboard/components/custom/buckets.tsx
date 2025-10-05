"use client";

import { useDashboardTranslations } from "@/contexts/dashboard-translations";
import { deleteResource } from "@/lib/delete-resource";
import { useQuery } from "@tanstack/react-query";
import { type Bucket } from "@workspace/server/drizzle/schema";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { type Locale } from "@workspace/ui/lib/i18n.config";
import Link from "next/link";
import { memo, useState } from "react";
import { AddBucketUsers } from "./add-bucket-users";
import { CSVUploader } from "./csv-uploader";
import { DeleteDialogWithConfirmation } from "./delete-dialog-with-confirmation";

interface Props {
  locale: Locale;
}

export const Buckets = memo(({ locale }: Props) => {
  const { sharedT } = useSharedTranslations();
  const { dashboardT } = useDashboardTranslations();

  const {
    data: buckets,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["buckets"],
    queryFn: () =>
      apiFetcher(
        (client) => client["buckets"]["maintained"].$get(),
        sharedT.apiCodes,
      ),
  });

  const [selectedBucket, setSelectedBucket] = useState<Bucket | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);

  if (isPending) {
    return (
      <div className="flex h-3/5 flex-col items-center justify-center space-y-8 p-2">
        <h1 className="text-2xl font-semibold">{dashboardT.buckets.loading}</h1>
        <div className="grid w-full max-w-4xl grid-cols-1 sm:grid-cols-[0.7fr_1fr]">
          <div className="h-72 w-full border-r p-2">
            <Skeleton className="size-full rounded-md" />
          </div>
          <div className="h-72 w-full p-2">
            <Skeleton className="size-full rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !buckets) {
    return (
      <div className="flex h-3/5 flex-col items-center justify-center space-y-8 p-2">
        <h1 className="text-center text-2xl font-semibold">
          {dashboardT.buckets.errorLoading}
        </h1>
      </div>
    );
  }

  if (buckets.length === 0) {
    return (
      <div className="flex h-3/5 flex-col items-center justify-center space-y-8 p-2">
        <h1 className="text-center text-2xl font-semibold">
          {dashboardT.buckets.noBuckets}
        </h1>
        <Button asChild>
          <Link href={`/${locale}/buckets/new`}>
            {dashboardT.buckets.createBucket}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 p-2">
      <h1 className="text-2xl font-semibold">{dashboardT.buckets.title}</h1>
      <div className="grid min-h-80 w-full max-w-4xl grid-cols-1 border-t sm:grid-cols-[0.75fr_1.2fr] md:grid-cols-1 lg:grid-cols-[0.6fr_1.4fr]">
        <ul className="space-y-2 p-2 sm:border-r">
          {buckets.map((bucket) => (
            <li
              key={bucket.id}
              className="cursor-pointer rounded-md border px-2 py-1"
              onClick={() =>
                setSelectedBucket({
                  ...bucket,
                  createdAt: new Date(bucket.createdAt),
                })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSelectedBucket({
                    ...bucket,
                    createdAt: new Date(bucket.createdAt),
                  });
                }
              }}
              role="button"
              tabIndex={0}
            >
              {bucket.name}
            </li>
          ))}
        </ul>
        <div className="w-full space-y-6 p-4">
          {selectedBucket ? (
            <>
              <div className="rounded-md border p-2">
                {Object.entries(selectedBucket)
                  .filter(
                    ([key]) =>
                      !["id", "owner", "subscription_id"].includes(key),
                  )
                  .map(([key, value]) => (
                    <div key={key} className="flex space-x-4 font-medium">
                      <span className="text-primary">{key}:</span>
                      <span>
                        {key === "createdAt"
                          ? value instanceof Date
                            ? value.toLocaleString()
                            : new Date(value).toLocaleString()
                          : key === "size" || key === "maxSize"
                            ? `${(Number(value) / (1024 * 1024 * 1024)).toFixed(
                                2,
                              )} GB`
                            : String(value)}
                      </span>
                    </div>
                  ))}
                <div className="mt-2 flex w-full justify-end gap-2">
                  <Button asChild>
                    <Link
                      href={`/${locale}/buckets/users?bucketId=${
                        selectedBucket.id
                      }&bucketName=${encodeURIComponent(
                        selectedBucket.name,
                      )}&usersCount=${selectedBucket.usersCount}`}
                    >
                      {dashboardT.buckets.manageUsers}
                    </Link>
                  </Button>
                  <Button
                    onClick={() => setDeleteDialog(true)}
                    variant="outline"
                  >
                    {dashboardT.buckets.delete}
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold">
                    {dashboardT.buckets.addUsers}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {dashboardT.buckets.addUsersDescription}
                  </p>
                </div>
                <CSVUploader bucketId={selectedBucket.id} />
              </div>
              <AddBucketUsers bucketId={selectedBucket.id} />
              <DeleteDialogWithConfirmation
                open={deleteDialog}
                setOpen={setDeleteDialog}
                deleteResource={(queryClient, errorDictionary) => {
                  setDeleteDialog(false);
                  return deleteResource({
                    deleteFetcher: apiFetcher(
                      (client) =>
                        client["buckets"][":bucketId"].$delete({
                          param: { bucketId: selectedBucket.id },
                        }),
                      errorDictionary,
                    ),
                    resourceId: selectedBucket.id,
                    queryClient,
                    queryKey: ["buckets"],
                    isInfinite: false,
                  });
                }}
                resourceType="bucket"
                resourceName={selectedBucket.name}
                description={dashboardT.buckets.deleteConfirmation}
              />
            </>
          ) : (
            <h2 className="text-lg font-medium">
              {dashboardT.buckets.selectBucket}
            </h2>
          )}
        </div>
      </div>
    </div>
  );
});
