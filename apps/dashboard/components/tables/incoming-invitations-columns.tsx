"use client";

import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import {
  BucketMaintainerInvitation,
  CourseMaintainerInvitation,
  UserInvitation,
} from "@workspace/server/drizzle/schema";
import { Button } from "@workspace/ui/components/button";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { type ErrorDictionary } from "@workspace/ui/lib/translation-utils";
import { toast } from "sonner";

export type IncomingInvitationsTableColumns = {
  type: "user" | "course_maintainer" | "bucket_maintainer";
  origin: string;
  originUsername: string;
  target: string;
  resourceId: string;
  resourceName: string;
  createdAt: string;
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
  await apiFetcher(
    (client) =>
      client["invitations"]["accept"].$post({
        json: {
          type,
          originUserId,
          resourceId,
        },
      }),
    errorDictionary,
  );
};

export const rejectInvitation = async ({
  type,
  originUserId,
  targetUserId,
  resourceId,
  errorDictionary,
}: {
  type: "user" | "course_maintainer" | "bucket_maintainer";
  originUserId: string;
  targetUserId: string;
  resourceId: string;
  errorDictionary: ErrorDictionary;
}) => {
  await apiFetcher(
    (client) =>
      client["invitations"]["reject"].$post({
        json: {
          type,
          originUserId,
          targetUserId,
          resourceId,
        },
      }),
    errorDictionary,
  );
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
        | UserInvitation[]
        | CourseMaintainerInvitation[]
        | BucketMaintainerInvitation[]
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
                ? "bucketId" in doc && doc.bucketId !== resourceId
                : "courseId" in doc && doc.courseId !== resourceId),
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
      accessorKey: "originUsername",
      header: "Sender Name",
    },
    {
      accessorKey: "target",
      header: "Recipient",
    },
    {
      accessorKey: "resourceId",
      header: "Resource Id",
    },
    {
      accessorKey: "resourceName",
      header: "Resource Name",
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => {
        return new Date(row.getValue("created_at")).toLocaleString();
      },
    },
    {
      accessorKey: "accept",
      header: "Accept",
      cell: ({ row }) => {
        const { sharedT } = useSharedTranslations();

        const queryClient = useQueryClient();

        const type = row.getValue("type") as
          | "user"
          | "course_maintainer"
          | "bucket_maintainer";
        const originUserId = row.getValue("origin") as string;
        const resourceId = row.getValue("resourceId") as string;
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
                  errorDictionary: sharedT.apiCodes,
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
        const { sharedT } = useSharedTranslations();

        const queryClient = useQueryClient();

        const type = row.getValue("type") as
          | "user"
          | "course_maintainer"
          | "bucket_maintainer";
        const originUserId = row.getValue("origin") as string;
        const resourceId = row.getValue("resourceId") as string;
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
                  errorDictionary: sharedT.apiCodes,
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
