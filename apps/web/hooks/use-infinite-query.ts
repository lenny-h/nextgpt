import { rpcFetcher } from "@/lib/fetcher";
import {
  type FetchNextPageOptions,
  type InfiniteQueryObserverResult,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { type Database } from "@workspace/ui/types/database";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

type RPCProcedure = keyof Database["public"]["Functions"];

interface UseInfiniteQueryProps<T extends RPCProcedure> {
  queryKey: string | string[];
  procedure: T;
  params?: Partial<Database["public"]["Functions"][T]["Args"]>;
  enabled?: boolean;
  pageSize?: number;
}

interface InfiniteQueryResult<T> {
  data: T[];
  isPending: boolean;
  error: Error | null;
  fetchNextPage: (
    options?: FetchNextPageOptions
  ) => Promise<InfiniteQueryObserverResult>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetching: boolean;
  inViewRef: (node?: Element | null) => void;
}

export function useInfiniteQueryWithRPC<T extends RPCProcedure>(
  options: UseInfiniteQueryProps<T>
): InfiniteQueryResult<
  NonNullable<
    Database["public"]["Functions"][T]["Returns"] extends Array<infer U>
      ? U
      : never
  >
> {
  const {
    queryKey,
    procedure,
    params = {},
    enabled = true,
    pageSize = 10,
  } = options;

  const queryKeyArray = Array.isArray(queryKey) ? queryKey : [queryKey];

  const {
    data,
    isPending,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
  } = useInfiniteQuery({
    queryKey: queryKeyArray,
    queryFn: async ({ pageParam }) => {
      return rpcFetcher(procedure, {
        ...params,
        ...(pageParam !== undefined ? { page_number: pageParam } : {}),
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      if (
        !lastPage ||
        (Array.isArray(lastPage) && lastPage.length < pageSize)
      ) {
        return undefined;
      }
      return lastPageParam + 1;
    },
    enabled,
  });

  const [ref, inView] = useInView({
    threshold: 0.5,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Safe type assertion since we know the structure of our data
  const flattenedData = data?.pages.flat() ?? [];

  return {
    data: flattenedData as NonNullable<
      Database["public"]["Functions"][T]["Returns"] extends Array<infer U>
        ? U
        : never
    >[],
    isPending,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    inViewRef: ref,
  };
}
