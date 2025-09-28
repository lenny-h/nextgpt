"use client";

import { incomingInvitationsColumns } from "@/components/tables/incoming-invitations-columns";
import { InfiniteDataTable } from "@/components/tables/infinite-data-table";
import { outgoingInvitationsColumns } from "@/components/tables/outgoing-invitations-columns";
import { useInfiniteQueryWithRPC } from "@/hooks/use-infinite-query";
import { Skeleton } from "@workspace/ui/components/skeleton";

interface InvitationsTabProps {
  type: "user" | "course_maintainer" | "bucket_maintainer";
}

export function InvitationsTab({ type }: InvitationsTabProps) {
  const {
    data: incomingInvitations,
    isPending: incomingPending,
    error: incomingError,
    fetchNextPage: fetchNextIncoming,
    hasNextPage: hasNextIncomingPage,
    isFetchingNextPage: isFetchingNextIncomingPage,
  } = useInfiniteQueryWithRPC({
    queryKey: [`incoming_${type}_invitations`],
    procedure: `get_incoming_invitations`,
    params: {
      invitation_type: type,
    },
  });

  const {
    data: outgoingInvitations,
    isPending: outgoingPending,
    error: outgoingError,
    fetchNextPage: fetchNextOutgoing,
    hasNextPage: hasNextOutgoingPage,
    isFetchingNextPage: isFetchingNextOutgoingPage,
  } = useInfiniteQueryWithRPC({
    queryKey: [`outgoing_${type}_invitations`],
    procedure: `get_outgoing_invitations`,
    params: {
      invitation_type: type,
    },
  });

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
            data={incomingInvitations.map((invitation) => ({
              ...invitation,
              type,
            }))}
            hasNextPage={hasNextIncomingPage}
            isFetching={isFetchingNextIncomingPage}
            fetchNextPage={fetchNextIncoming}
            visibilityState={{
              type: false,
              origin: false,
              origin_username: true,
              target: false,
              resource_id: false,
              resource_name: true,
              created_at: true,
              accept: true,
              reject: true,
            }}
            filterLabel="sender username"
            filterColumn="origin_username"
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
            data={outgoingInvitations.map((invitation) => ({
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
              target_username: true,
              resource_id: false,
              resource_name: true,
              created_at: true,
              accept: true,
              reject: true,
            }}
            filterLabel="recipient username"
            filterColumn="target_username"
          />
        )}
      </div>
    </div>
  );
}
