import { type QueryClient } from "@tanstack/react-query";
import { type ProtectedApiType } from "@workspace/api-routes/routes/protected/index";
import {
  checkResponse,
  type ErrorDictionary,
} from "@workspace/ui/lib/translation-utils";
import { type ClientResponse, hc } from "hono/client";

// export const apiFetcher = async (
//   url: string,
//   init: RequestInit,
//   errorDictionary: ErrorDictionary
// ) => {
//   const response = await fetch(
//     `${process.env.NEXT_PUBLIC_API_URL}/api/protected/${url}`,
//     init
//   );
//   checkResponse(response, errorDictionary);
//   return response.json();
// };

export function createProtectedApiClient() {
  return hc<ProtectedApiType>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/protected`,
    {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        return fetch(input, {
          ...init,
          credentials: "include",
        });
      },
    }
  );
}

/**
 * Type-safe fetcher using Hono client
 * @example
 * const data = await apiFetcher(
 *   (client) => client.users.$get(),
 *   errorDictionary
 * );
 */
export async function apiFetcher<T>(
  clientCallback: (
    client: ReturnType<typeof createProtectedApiClient>
  ) => Promise<ClientResponse<T>>,
  errorDictionary: ErrorDictionary
): Promise<T> {
  const client = createProtectedApiClient();
  const response = await clientCallback(client);
  await checkResponse(response, errorDictionary);
  return response.json() as Promise<T>;
}

export async function updateCache<T extends { id: string }>(
  queryClient: QueryClient,
  queryKey: string[],
  itemId: string
) {
  queryClient.setQueryData(queryKey, (oldData: T[]) => {
    if (!oldData) return oldData;
    return oldData.filter((item) => item.id !== itemId);
  });
}

export function removeFromInfiniteCache<T extends { id: string }>(
  queryClient: QueryClient,
  queryKey: string[],
  itemId: string
) {
  queryClient.setQueryData(
    queryKey,
    (oldData: { pages: Array<T[]>; pageParams: number[] }) => {
      if (!oldData) return oldData;
      return {
        pages: oldData.pages.map((page) =>
          page.filter((item) => item.id !== itemId)
        ),
        pageParams: oldData.pageParams,
      };
    }
  );
}

export function updateInfiniteCache<T extends { id: string }>(
  queryClient: QueryClient,
  queryKey: string[],
  updateFunction: (item: T) => T
) {
  queryClient.setQueryData(
    queryKey,
    (oldData: { pages: Array<T[]>; pageParams: number[] }) => {
      if (!oldData) return oldData;
      return {
        pages: oldData.pages.map((page) => page.map(updateFunction)),
        pageParams: oldData.pageParams,
      };
    }
  );
}
