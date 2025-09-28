import { type QueryClient } from "@tanstack/react-query";
import {
  checkResponse,
  type ErrorDictionary,
} from "@workspace/ui/lib/translation-utils";

export const apiFetcher = async (
  url: string,
  init: RequestInit,
  errorDictionary: ErrorDictionary
) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/capi/protected/${url}`,
    init
  );
  checkResponse(response, errorDictionary);
  return response.json();
};

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
