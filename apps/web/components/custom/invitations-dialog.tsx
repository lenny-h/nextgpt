"use client";

import { useGlobalTranslations } from "@/contexts/web-translations";
import { useInfiniteQueryWithRPC } from "@/hooks/use-infinite-query";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { checkResponse } from "@workspace/ui/lib/translation-utils";
import { Check, Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface InvitationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Invitation {
  created_at: string;
  origin: string;
  origin_username: string;
  resource_id: string;
  resource_name: string;
  target: string;
}

export function InvitationsDialog({
  open,
  onOpenChange,
}: InvitationsDialogProps) {
  const { globalT } = useGlobalTranslations();
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
    procedure: "get_incoming_invitations",
    params: { invitation_type: "user" },
    enabled: open,
  });

  const acceptInvitation = async (invitation: Invitation) => {
    try {
      setProcessingId(`accept-${invitation.origin}-${invitation.resource_id}`);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/capi/protected/invitations/accept`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            type: "user",
            originUserId: invitation.origin,
            resourceId: invitation.resource_id,
          }),
        },
      );

      checkResponse(response, globalT.globalErrors);

      toast.success(`You've joined ${invitation.resource_name}`);
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      queryClient.invalidateQueries({ queryKey: ["buckets"] });
    } catch (error) {
      toast.error("Failed to accept invitation");
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  const rejectInvitation = async (invitation: Invitation) => {
    try {
      setProcessingId(`reject-${invitation.origin}-${invitation.resource_id}`);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/capi/protected/invitations/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            type: "user",
            originUserId: invitation.origin,
            resourceId: invitation.resource_id,
          }),
        },
      );

      checkResponse(response, globalT.globalErrors);

      toast.success("Invitation rejected");
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
    } catch (error) {
      toast.error("Failed to reject invitation");
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invitations</DialogTitle>
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
              Error loading invitations
            </p>
          ) : invitations && invitations.length > 0 ? (
            <>
              {invitations.map((invitation) => (
                <div
                  key={`${invitation.origin}-${invitation.resource_id}`}
                  className="flex flex-col space-y-2 rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {invitation.origin_username} invited you to join
                    </p>
                    <p className="text-base font-semibold">
                      {invitation.resource_name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(invitation.created_at).toLocaleDateString()}
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
                      `reject-${invitation.origin}-${invitation.resource_id}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="mr-1 h-4 w-4" />
                      )}
                      Reject
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => acceptInvitation(invitation)}
                      disabled={!!processingId}
                    >
                      {processingId ===
                      `accept-${invitation.origin}-${invitation.resource_id}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-1 h-4 w-4" />
                      )}
                      Accept
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
              No invitations found
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
