"use client";

import { incomingInvitationsColumns } from "@/components/tables/incoming-invitations-columns";
import { InfiniteDataTable } from "@/components/tables/infinite-data-table";
import { outgoingInvitationsColumns } from "@/components/tables/outgoing-invitations-columns";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { useInfiniteQueryWithRPC } from "@workspace/ui/hooks/use-infinite-query";
import { apiFetcher } from "@workspace/ui/lib/fetcher";

interface InvitationsTabProps {
  type: "user" | "course_maintainer" | "bucket_maintainer";
}

export function InvitationsTab({ type }: InvitationsTabProps) {
  const { sharedT } = useSharedTranslations();

  const {
    data: incomingInvitationsData,
    isPending: incomingPending,
    error: incomingError,
    fetchNextPage: fetchNextIncoming,
    hasNextPage: hasNextIncomingPage,
    isFetchingNextPage: isFetchingNextIncomingPage,
  } = useInfiniteQueryWithRPC({
    queryKey: [`incoming_${type}_invitations`],
    queryFn: ({ pageParam }) =>
      apiFetcher(
        (client) =>
          client.invitations.incoming.$get({
            query: {
              invitationType: type,
              pageNumber: (pageParam ?? 0).toString(),
              itemsPerPage: "10",
            },
          }),
        sharedT.apiCodes,
      ),
  });

  const incomingInvitations = incomingInvitationsData?.items;

  const {
    data: outgoingInvitationsData,
    isPending: outgoingPending,
    error: outgoingError,
    fetchNextPage: fetchNextOutgoing,
    hasNextPage: hasNextOutgoingPage,
    isFetchingNextPage: isFetchingNextOutgoingPage,
  } = useInfiniteQueryWithRPC({
    queryKey: [`outgoing_${type}_invitations`],
    queryFn: ({ pageParam }) =>
      apiFetcher(
        (client) =>
          client.invitations.outgoing.$get({
            query: {
              invitationType: type,
              pageNumber: (pageParam ?? 0).toString(),
              itemsPerPage: "10",
            },
          }),
        sharedT.apiCodes,
      ),
  });

  const outgoingInvitations = outgoingInvitationsData?.items;

  return (
    <div className="flex flex-col space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Incoming</h2>
        {incomingPending ? (
          <Skeleton className="mx-auto h-96 w-full rounded-md" />
        ) : incomingError ? (
          <h1 className="mt-8 text-center text-2xl font-semibold">
            Could not fetch the incoming {type} invitations. Please try again
            later.
          </h1>
        ) : (
          <InfiniteDataTable
            columns={incomingInvitationsColumns}
            data={(incomingInvitations ?? []).map((invitation) => ({
              ...invitation,
              type,
            }))}
            hasNextPage={hasNextIncomingPage}
            isFetching={isFetchingNextIncomingPage}
            fetchNextPage={fetchNextIncoming}
            visibilityState={{
              type: false,
              origin: false,
              originUsername: true,
              target: false,
              resourceId: false,
              resourceName: true,
              createdAt: true,
              accept: true,
              reject: true,
            }}
            filterLabel="sender username"
            filterColumn="originUsername"
          />
        )}
      </div>
      <div>
        <h2 className="text-xl font-semibold">Outgoing</h2>
        {outgoingPending ? (
          <Skeleton className="mx-auto h-96 w-full rounded-md" />
        ) : outgoingError ? (
          <h1 className="mt-8 text-center text-2xl font-semibold">
            Could not fetch the outgoing {type} invitations. Please try again
            later.
          </h1>
        ) : (
          <InfiniteDataTable
            columns={outgoingInvitationsColumns}
            data={(outgoingInvitations ?? []).map((invitation) => ({
              ...invitation,
              type,
            }))}
            hasNextPage={hasNextOutgoingPage}
            isFetching={isFetchingNextOutgoingPage}
            fetchNextPage={fetchNextOutgoing}
            visibilityState={{
              type: false,
              origin: false,
              target: false,
              targetUsername: true,
              resourceId: false,
              resourceName: true,
              createdAt: true,
              accept: true,
              reject: true,
            }}
            filterLabel="recipient username"
            filterColumn="targetUsername"
          />
        )}
      </div>
    </div>
  );
}
