import { type QueryClient } from "@tanstack/react-query";
import {
  removeFromInfiniteCache,
  updateCache,
} from "@workspace/ui/lib/fetcher";

export async function deleteResource({
  deletePromise,
  resourceId,
  queryClient,
  queryKey,
  isInfinite,
}: {
  deletePromise: Promise<{ name: string }>;
  resourceId: string;
  queryClient: QueryClient;
  queryKey: string[];
  isInfinite: boolean;
}) {
  const response = await deletePromise;

  if (isInfinite) {
    removeFromInfiniteCache(queryClient, queryKey, resourceId);
  } else {
    updateCache(queryClient, queryKey, resourceId);
  }

  return response;
}
