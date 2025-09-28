"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@workspace/ui/components/button";
import { toast } from "sonner";
import {
  rejectInvitation,
  updateInvitationsQueryData,
} from "./incoming-invitations-columns";

export type outgoingInvitationsTableColumns = {
  type: "user" | "course_maintainer" | "bucket_maintainer";
  origin: string;
  target: string;
  target_username: string;
  resource_id: string;
  resource_name: string;
  created_at: string;
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
      accessorKey: "target_username",
      header: "Recipient Name",
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
      accessorKey: "delete",
      header: "Delete",
      cell: ({ row }) => {
        const queryClient = useQueryClient();
        const type = row.getValue("type") as
          | "user"
          | "course_maintainer"
          | "bucket_maintainer";
        const targetUserId = row.getValue("target") as string;
        const resourceId = row.getValue("resource_id") as string;

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
