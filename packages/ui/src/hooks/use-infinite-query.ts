import {
  type FetchNextPageOptions,
  type InfiniteQueryObserverResult,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

interface UseInfiniteQueryProps<T> {
  queryKey: string[];
  queryFn: ({ pageParam }: { pageParam?: number }) => Promise<T[]>;
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

export function useInfiniteQueryWithRPC<T>(
  options: UseInfiniteQueryProps<T>
): InfiniteQueryResult<T> {
  const { queryKey, queryFn, enabled = true, pageSize = 10 } = options;

  const {
    data,
    isPending,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
  } = useInfiniteQuery({
    queryKey,
    queryFn,
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
    data: flattenedData as T[],
    isPending,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    inViewRef: ref,
  };
}
