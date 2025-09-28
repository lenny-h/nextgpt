"use client";

import { useGlobalTranslations } from "@/contexts/global-translations";
import { type Locale } from "@/i18n.config";
import { deleteResource } from "@/lib/delete-resource";
import { rpcFetcher } from "@/lib/fetcher";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { type Tables } from "@workspace/ui/types/database";
import Link from "next/link";
import { memo, useState } from "react";
import { AddBucketUsers } from "./add-bucket-users";
import { CSVUploader } from "./csv-uploader";
import { DeleteDialogWithConfirmation } from "./delete-dialog-with-confirmation";

interface Props {
  locale: Locale;
}

export const Buckets = memo(({ locale }: Props) => {
  const { globalT } = useGlobalTranslations();

  const {
    data: buckets,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["buckets"],
    queryFn: () =>
      rpcFetcher<"get_maintained_buckets">("get_maintained_buckets"),
  });

  const [selectedBucket, setSelectedBucket] =
    useState<Tables<"buckets"> | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);

  if (isPending) {
    return (
      <div className="flex h-3/5 flex-col items-center justify-center space-y-8 p-2">
        <h1 className="text-2xl font-semibold">
          {globalT.components.buckets.loading}
        </h1>
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
          {globalT.components.buckets.errorLoading}
        </h1>
      </div>
    );
  }

  if (buckets.length === 0) {
    return (
      <div className="flex h-3/5 flex-col items-center justify-center space-y-8 p-2">
        <h1 className="text-center text-2xl font-semibold">
          {globalT.components.buckets.noBuckets}
        </h1>
        <Button asChild>
          <Link href={`/${locale}/buckets/new`}>
            {globalT.components.buckets.createBucket}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 p-2">
      <h1 className="text-2xl font-semibold">
        {globalT.components.buckets.title}
      </h1>
      <div className="grid min-h-80 w-full max-w-4xl grid-cols-1 border-t sm:grid-cols-[0.75fr_1.2fr] md:grid-cols-1 lg:grid-cols-[0.6fr_1.4fr]">
        <ul className="space-y-2 p-2 sm:border-r">
          {buckets.map((bucket) => (
            <li
              key={bucket.id}
              className="cursor-pointer rounded-md border px-2 py-1"
              onClick={() => setSelectedBucket(bucket)}
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
                        {key === "created_at"
                          ? new Date(value).toLocaleString()
                          : key === "size" || key === "max_size"
                            ? `${(Number(value) / (1024 * 1024 * 1024)).toFixed(
                                2,
                              )} GB`
                            : value}
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
                      )}&usersCount=${selectedBucket.users_count}`}
                    >
                      {globalT.components.buckets.manageUsers}
                    </Link>
                  </Button>
                  <Button
                    onClick={() => setDeleteDialog(true)}
                    variant="outline"
                  >
                    {globalT.components.buckets.delete}
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold">
                    {globalT.components.buckets.addUsers}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {globalT.components.buckets.addUsersDescription}
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
                    fetchUrl: "buckets",
                    resourceId: selectedBucket.id,
                    queryClient,
                    queryKey: ["buckets"],
                    isInfinite: false,
                    globalErrors: errorDictionary,
                  });
                }}
                resourceType="bucket"
                resourceName={selectedBucket.name}
                description={globalT.components.buckets.deleteConfirmation}
              />
            </>
          ) : (
            <h2 className="text-lg font-medium">
              {globalT.components.buckets.selectBucket}
            </h2>
          )}
        </div>
      </div>
    </div>
  );
});
