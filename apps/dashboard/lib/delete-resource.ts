import { type QueryClient } from "@tanstack/react-query";
import {
  checkResponse,
  type ErrorDictionary,
} from "@workspace/ui/lib/translation-utils";
import { removeFromInfiniteCache, updateCache } from "./fetcher";

export async function deleteResource({
  fetchUrl,
  resourceId,
  queryClient,
  queryKey,
  isInfinite,
  globalErrors,
}: {
  fetchUrl: string;
  resourceId: string;
  queryClient: QueryClient;
  queryKey: string[];
  isInfinite: boolean;
  globalErrors: ErrorDictionary;
}) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/capi/protected/${fetchUrl}/${resourceId}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  checkResponse(response, globalErrors);

  if (isInfinite) {
    removeFromInfiniteCache(queryClient, queryKey, resourceId);
  } else {
    updateCache(queryClient, queryKey, resourceId);
  }

  return await response.json();
}
