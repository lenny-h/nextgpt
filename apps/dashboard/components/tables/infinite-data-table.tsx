"use client";

import { ColumnDef, VisibilityState } from "@tanstack/react-table";
import { DataTable } from "@workspace/ui/components/data-table";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  hasNextPage: boolean;
  isFetching: boolean;
  fetchNextPage: () => void;
  visibilityState: VisibilityState;
  filterLabel: string;
  filterColumn: string;
  queryKey?: string[];
  isRefreshing?: boolean;
}

export function InfiniteDataTable<T>({
  columns,
  data,
  hasNextPage,
  isFetching,
  fetchNextPage,
  visibilityState,
  filterLabel,
  filterColumn,
  queryKey = [],
  isRefreshing = false,
}: DataTableProps<T>) {
  const [ref, inView] = useInView({
    threshold: 0.5,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetching) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetching, fetchNextPage]);

  return (
    <DataTable
      columns={columns}
      data={data}
      visibilityState={visibilityState}
      filterLabel={filterLabel}
      filterColumn={filterColumn}
      queryKey={queryKey}
      isRefreshing={isRefreshing}
    >
      {hasNextPage && (
        <div ref={ref} className="h-8 flex justify-center items-center">
          {isFetching && <Loader2 className="animate-spin size-4" />}
        </div>
      )}
    </DataTable>
  );
}
