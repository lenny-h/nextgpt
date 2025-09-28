import { type QueryClient } from "@tanstack/react-query";
import { type Database } from "@workspace/ui/types/database";
import { createClient } from "./supabase/client";

interface ApplicationError extends Error {
  info: string;
  status: number;
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error(
      "An error occurred while fetching the data.",
    ) as ApplicationError;

    error.info = await res.json();
    error.status = res.status;

    throw error;
  }

  return res.json();
};

export const rpcFetcher = async <
  T extends keyof Database["public"]["Functions"],
>(
  procedure: T,
  body: Database["public"]["Functions"][T]["Args"] = {},
): Promise<Database["public"]["Functions"][T]["Returns"]> => {
  console.log(procedure, body);

  const supabase = createClient();

  const { data, error } = await supabase.rpc(procedure, body);

  if (error) {
    console.error("Error fetching data:", error);
    throw new Error("An error occurred while fetching the data.");
  }

  return data;
};

export async function updateCache<T extends { id: string }>(
  queryClient: QueryClient,
  queryKey: string[],
  itemId: string,
) {
  queryClient.setQueryData(queryKey, (oldData: T[]) => {
    if (!oldData) return oldData;
    return oldData.filter((item) => item.id !== itemId);
  });
}

export function removeFromInfiniteCache<T extends { id: string }>(
  queryClient: QueryClient,
  queryKey: string[],
  itemId: string,
) {
  queryClient.setQueryData(
    queryKey,
    (oldData: { pages: Array<T[]>; pageParams: number[] }) => {
      if (!oldData) return oldData;
      return {
        pages: oldData.pages.map((page) =>
          page.filter((item) => item.id !== itemId),
        ),
        pageParams: oldData.pageParams,
      };
    },
  );
}

export function updateInfiniteCache<T extends { id: string }>(
  queryClient: QueryClient,
  queryKey: string[],
  updateFunction: (item: T) => T,
) {
  queryClient.setQueryData(
    queryKey,
    (oldData: { pages: Array<T[]>; pageParams: number[] }) => {
      if (!oldData) return oldData;
      return {
        pages: oldData.pages.map((page) => page.map(updateFunction)),
        pageParams: oldData.pageParams,
      };
    },
  );
}
