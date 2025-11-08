"use client";

import { deleteResource } from "@/lib/delete-resource";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { DeleteDialog } from "../custom/delete-dialog";

export type FileTableColumns = {
  id: string;
  name: string;
  size: number;
  createdAt: string;
};

export const filesColumns: ColumnDef<FileTableColumns>[] = [
  { accessorKey: "id", header: "Id" },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      return (
        <p className="max-w-32 truncate md:max-w-80">{row.getValue("name")}</p>
      );
    },
  },
  {
    accessorKey: "size",
    header: "Size",
    cell: ({ row }) => {
      const size = row.getValue("size") as number;
      return `${(size / 1024).toFixed(2)} KB`;
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
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const [deleteDialog, setDeleteDialog] = useState(false);

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
                deletePromise: apiFetcher(
                  (client) =>
                    client["files"][":fileId"].$delete({
                      param: { fileId: row.getValue("id") },
                    }),
                  errorDictionary,
                ),
                resourceId: row.getValue("id"),
                queryClient,
                queryKey: ["files"],
                isInfinite: true,
              });
            }}
            resourceType="file"
            description="Are you sure you want to delete this file? This action cannot be undone."
          />
        </>
      );
    },
  },
];
