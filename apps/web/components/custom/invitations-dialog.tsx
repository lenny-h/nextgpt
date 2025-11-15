"use client";

import { useWebTranslations } from "@/contexts/web-translations";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { useInfiniteQueryWithRPC } from "@workspace/ui/hooks/use-infinite-query";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { Check, Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Invitation = {
  origin: string;
  originUsername: string;
  target: string;
  resourceId: string;
  createdAt: string;
  resourceName: string;
};

interface InvitationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvitationsDialog({
  open,
  onOpenChange,
}: InvitationsDialogProps) {
  const { sharedT } = useSharedTranslations();
  const { webT } = useWebTranslations();
  const queryClient = useQueryClient();

  const [processingId, setProcessingId] = useState<string | null>(null);

  const {
    data: invitations,
    isPending,
    error,
    inViewRef,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQueryWithRPC({
    queryKey: ["invitations"],
    queryFn: ({ pageParam }) =>
      apiFetcher(
        (client) =>
          client.invitations.incoming.$get({
            query: {
              invitationType: "user",
              pageNumber: (pageParam ?? 0).toString(),
              itemsPerPage: "10",
            },
          }),
        sharedT.apiCodes,
      ),
    enabled: open,
  });

  const acceptInvitation = async (invitation: Invitation) => {
    try {
      setProcessingId(`accept-${invitation.origin}-${invitation.resourceId}`);

      await apiFetcher(
        (client) =>
          client.invitations.accept.$post({
            json: {
              type: "user",
              originUserId: invitation.origin,
              resourceId: invitation.resourceId,
            },
          }),
        sharedT.apiCodes,
      );

      toast.success(
        webT.invitations.accepted.replace(
          "{resourceName}",
          invitation.resourceName,
        ),
      );
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      queryClient.invalidateQueries({ queryKey: ["buckets"] });
    } catch (error) {
      toast.error(webT.invitations.failedAccept);
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  const rejectInvitation = async (invitation: Invitation) => {
    try {
      setProcessingId(`reject-${invitation.origin}-${invitation.resourceId}`);

      await apiFetcher(
        (client) =>
          client.invitations.reject.$post({
            json: {
              type: "user",
              originUserId: invitation.origin,
              resourceId: invitation.resourceId,
            },
          }),
        sharedT.apiCodes,
      );

      toast.success(webT.invitations.rejected);
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
    } catch (error) {
      toast.error(webT.invitations.failedReject);
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{webT.invitations.title}</DialogTitle>
        </DialogHeader>
        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {isPending ? (
            <>
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="flex h-20 items-center rounded-lg border p-3"
                />
              ))}
            </>
          ) : error ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {webT.invitations.errorLoading}
            </p>
          ) : invitations && invitations.length > 0 ? (
            <>
              {invitations.map((invitation) => (
                <div
                  key={`${invitation.origin}-${invitation.resourceId}`}
                  className="flex flex-col space-y-2 rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {webT.invitations.invitedYouToJoin.replace(
                        "{username}",
                        invitation.originUsername,
                      )}
                    </p>
                    <p className="text-base font-semibold">
                      {invitation.resourceName}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(invitation.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => rejectInvitation(invitation)}
                      disabled={!!processingId}
                    >
                      {processingId ===
                      `reject-${invitation.origin}-${invitation.resourceId}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="mr-1 h-4 w-4" />
                      )}
                      {webT.invitations.reject}
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => acceptInvitation(invitation)}
                      disabled={!!processingId}
                    >
                      {processingId ===
                      `accept-${invitation.origin}-${invitation.resourceId}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-1 h-4 w-4" />
                      )}
                      {webT.invitations.accept}
                    </Button>
                  </div>
                </div>
              ))}
              {hasNextPage && (
                <div
                  ref={inViewRef}
                  className="flex h-8 items-center justify-center"
                >
                  {isFetchingNextPage && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {webT.invitations.noInvitations}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
