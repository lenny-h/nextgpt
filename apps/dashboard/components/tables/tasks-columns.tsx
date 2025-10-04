"use client";

import { deleteResource } from "@/lib/delete-resource";
import type { ColumnDef } from "@tanstack/react-table";
import { TaskStatus } from "@workspace/server/drizzle/schema";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { cn } from "@workspace/ui/lib/utils";
import { ArrowUpDown, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { DeleteDialog } from "../custom/delete-dialog";

export type TaskTableColumns = {
  id: string;
  name: string;
  status: TaskStatus;
  createdAt: string;
  pubDate: string;
};

export const tasksColumns: ColumnDef<TaskTableColumns>[] = [
  { accessorKey: "id", header: "Id" },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const filename = row.getValue("name") as string;
      return filename;
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="size-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          className={cn(
            "ml-2",
            status === "scheduled"
              ? "bg-gray-500"
              : status === "processing"
                ? "bg-blue-500"
                : status === "failed"
                  ? "bg-red-500"
                  : "bg-green-500",
          )}
        >
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      return new Date(row.getValue("createdAt")).toLocaleString();
    },
  },
  {
    accessorKey: "pubDate",
    header: "Scheduled For",
    cell: ({ row }) => {
      const pubDate = row.getValue("pubDate");
      return pubDate ? new Date(pubDate as string).toLocaleString() : "ASAP";
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const [deleteDialog, setDeleteDialog] = useState(false);

      if (row.getValue("status") !== "scheduled") {
        return <div className="flex h-8 items-center">No actions</div>;
      }

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuItem
                className="cursor-pointer text-red-500 focus:text-red-400"
                onClick={() => setDeleteDialog(true)}
              >
                <Trash2 />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DeleteDialog
            open={deleteDialog}
            setOpen={setDeleteDialog}
            deleteResource={(queryClient, errorDictionary) => {
              setDeleteDialog(false);
              return deleteResource({
                fetchUrl: "tasks",
                resourceId: row.getValue("id"),
                queryClient,
                queryKey: ["tasks"],
                isInfinite: true,
                globalErrors: errorDictionary,
              });
            }}
            resourceType="task"
            description="Are you sure you want to delete this task? This action cannot be undone."
          />
        </>
      );
    },
  },
];
