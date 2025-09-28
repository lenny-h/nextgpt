"use client";

import { type Locale } from "@/i18n.config";
import { rpcFetcher } from "@/lib/fetcher";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { DataTable } from "@workspace/ui/components/data-table";
import { Skeleton } from "@workspace/ui/components/skeleton";
import Link from "next/link";
import { modelsColumns } from "../tables/models-columns";

interface Props {
  locale: Locale;
}

export const Models = ({ locale }: Props) => {
  const {
    data: models,
    isLoading: modelsLoading,
    error: modelsError,
  } = useQuery({
    queryKey: ["models"],
    queryFn: () => rpcFetcher<"get_bucket_models">("get_bucket_models"),
  });

  if (modelsLoading) {
    return (
      <div className="flex h-3/5 flex-col items-center justify-center space-y-8 p-2">
        <h1 className="text-2xl font-semibold">Loading models...</h1>
        <Skeleton className="mx-auto h-96 w-full max-w-4xl" />
      </div>
    );
  }

  if (modelsError || !models) {
    return (
      <div className="flex h-3/5 flex-col items-center justify-center space-y-8 p-2">
        <h1 className="text-center text-2xl font-semibold">
          Models could not be loaded. Please try again later.
        </h1>
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="flex h-3/5 flex-col items-center justify-center space-y-8 p-2">
        <h1 className="text-center text-2xl font-semibold">
          Looks like there are no models yet
        </h1>
        <Button asChild>
          <Link href={`/${locale}/models/new`}>Add model</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 p-2">
      <div className="flex items-center space-x-2">
        <h1 className="text-2xl font-semibold">Models</h1>
      </div>
      <DataTable
        columns={modelsColumns}
        data={models}
        visibilityState={{
          id: false,
          bucket_id: false,
          bucket_name: true,
          name: true,
          created_at: true,
        }}
        filterLabel="model name"
        filterColumn="name"
      />
    </div>
  );
};
