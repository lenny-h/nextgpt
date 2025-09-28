"use client";

import { useGlobalTranslations } from "@/contexts/global-translations";
import { createClient } from "@/lib/supabase/client";
import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@workspace/ui/components/button";
import {
  checkResponse,
  type ErrorDictionary,
} from "@workspace/ui/lib/translation-utils";
import { type Tables } from "@workspace/ui/types/database";
import { toast } from "sonner";

export type IncomingInvitationsTableColumns = {
  type: "user" | "course_maintainer" | "bucket_maintainer";
  origin: string;
  origin_username: string;
  target: string;
  resource_id: string;
  resource_name: string;
  created_at: string;
};

const acceptInvitation = async ({
  type,
  originUserId,
  resourceId,
  errorDictionary,
}: {
  type: "user" | "course_maintainer" | "bucket_maintainer";
  originUserId: string;
  resourceId: string;
  errorDictionary: ErrorDictionary;
}) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/capi/protected/invitations/accept`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        type,
        originUserId,
        resourceId,
      }),
    },
  );

  checkResponse(response, errorDictionary);
};

export const rejectInvitation = async ({
  type,
  originUserId,
  targetUserId,
  resourceId,
}: {
  type: "user" | "course_maintainer" | "bucket_maintainer";
  originUserId: string;
  targetUserId: string;
  resourceId: string;
}) => {
  const supabase = createClient();

  const { error } = await supabase.rpc("delete_invitation", {
    p_invitation_type: type,
    p_origin: originUserId,
    p_target: targetUserId,
    p_resource_id: resourceId,
  });

  if (error) {
    throw new Error("Failed to reject invitation");
  }
};

export const updateInvitationsQueryData = ({
  queryClient,
  type,
  targetUserId,
  resourceId,
}: {
  queryClient: QueryClient;
  type: "user" | "course_maintainer" | "bucket_maintainer";
  targetUserId: string;
  resourceId: string;
}) => {
  queryClient.setQueryData(
    [`incoming_${type}_invitations`],
    (oldData: {
      pages: Array<
        (
          | Tables<"user_invitations">
          | Tables<"course_maintainer_invitations">
          | Tables<"bucket_maintainer_invitations">
        )[]
      >;
      pageParams: number[];
    }) => {
      if (!oldData) return oldData;
      return {
        pages: oldData.pages.map((page) =>
          page.filter(
            (doc) =>
              doc.target !== targetUserId ||
              (type === "user"
                ? "bucket_id" in doc && doc.bucket_id !== resourceId
                : "course_id" in doc && doc.course_id !== resourceId),
          ),
        ),
        pageParams: oldData.pageParams,
      };
    },
  );
};

export const incomingInvitationsColumns: ColumnDef<IncomingInvitationsTableColumns>[] =
  [
    { accessorKey: "type", header: "Type" },
    { accessorKey: "origin", header: "Sender" },
    {
      accessorKey: "origin_username",
      header: "Sender Name",
    },
    {
      accessorKey: "target",
      header: "Recipient",
    },
    {
      accessorKey: "resource_id",
      header: "Resource Id",
    },
    {
      accessorKey: "resource_name",
      header: "Resource Name",
    },
    {
      accessorKey: "created_at",
      header: "Created At",
      cell: ({ row }) => {
        return new Date(row.getValue("created_at")).toLocaleString();
      },
    },
    {
      accessorKey: "accept",
      header: "Accept",
      cell: ({ row }) => {
        const { globalT } = useGlobalTranslations();

        const queryClient = useQueryClient();
        const type = row.getValue("type") as
          | "user"
          | "course_maintainer"
          | "bucket_maintainer";
        const originUserId = row.getValue("origin") as string;
        const resourceId = row.getValue("resource_id") as string;
        const targetUserId = row.getValue("target") as string;

        return (
          <Button
            className="text-primary"
            onClick={() => {
              toast.promise(
                acceptInvitation({
                  type,
                  originUserId,
                  resourceId,
                  errorDictionary: globalT.globalErrors,
                }),
                {
                  loading: "Accepting...",
                  success: () => {
                    updateInvitationsQueryData({
                      queryClient,
                      type,
                      targetUserId,
                      resourceId,
                    });
                    return "Accepted invitation!";
                  },
                  error: () =>
                    "Failed to accept invitation. Please try again later.",
                },
              );
            }}
            variant="outline"
          >
            Accept
          </Button>
        );
      },
    },
    {
      accessorKey: "reject",
      header: "Reject",
      cell: ({ row }) => {
        const queryClient = useQueryClient();
        const type = row.getValue("type") as
          | "user"
          | "course_maintainer"
          | "bucket_maintainer";
        const originUserId = row.getValue("origin") as string;
        const resourceId = row.getValue("resource_id") as string;
        const targetUserId = row.getValue("target") as string;

        return (
          <Button
            className="text-red-500"
            onClick={() => {
              toast.promise(
                rejectInvitation({
                  type,
                  originUserId,
                  targetUserId,
                  resourceId,
                }),
                {
                  loading: "Rejecting...",
                  success: () => {
                    updateInvitationsQueryData({
                      queryClient,
                      type,
                      targetUserId,
                      resourceId,
                    });
                    return "Rejected invitation!";
                  },
                  error: () =>
                    "Failed to reject invitation. Please try again later.",
                },
              );
            }}
            variant="outline"
          >
            Reject
          </Button>
        );
      },
    },
  ];
