"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@workspace/ui/components/button";
import { toast } from "sonner";
import {
  rejectInvitation,
  updateInvitationsQueryData,
} from "./incoming-invitations-columns";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";

export type outgoingInvitationsTableColumns = {
  type: "user" | "course_maintainer" | "bucket_maintainer";
  origin: string;
  target: string;
  targetUsername: string;
  resourceId: string;
  resourceName: string;
  createdAt: string;
};

export const outgoingInvitationsColumns: ColumnDef<outgoingInvitationsTableColumns>[] =
  [
    { accessorKey: "type", header: "Type" },
    { accessorKey: "origin", header: "Sender" },
    {
      accessorKey: "target",
      header: "Recipient",
    },
    {
      accessorKey: "targetUsername",
      header: "Recipient Name",
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
        return new Date(row.getValue("createdAt")).toLocaleString();
      },
    },
    {
      accessorKey: "delete",
      header: "Delete",
      cell: ({ row }) => {
        const { sharedT } = useSharedTranslations();
        const queryClient = useQueryClient();

        const type = row.getValue("type") as
          | "user"
          | "course_maintainer"
          | "bucket_maintainer";
        const targetUserId = row.getValue("target") as string;
        const resourceId = row.getValue("resourceId") as string;

        return (
          <Button
            className="text-red-500"
            onClick={() => {
              toast.promise(
                rejectInvitation({
                  type,
                  originUserId: row.getValue("origin"),
                  targetUserId,
                  resourceId,
                  errorDictionary: sharedT.apiCodes,
                }),
                {
                  loading: "Deleting...",
                  success: () => {
                    updateInvitationsQueryData({
                      queryClient,
                      type,
                      targetUserId,
                      resourceId,
                    });
                    return "Deleted invitation!";
                  },
                  error: () =>
                    "Failed to delete document. Please try again later.",
                },
              );
            }}
            variant="outline"
          >
            Delete
          </Button>
        );
      },
    },
  ];
