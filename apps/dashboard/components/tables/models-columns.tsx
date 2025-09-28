"use client";

import { deleteResource } from "@/lib/delete-resource";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { DeleteDialog } from "../custom/delete-dialog";

export type ModelTableColumns = {
  id: string;
  bucket_id: string;
  bucket_name: string;
  name: string;
  created_at: string;
};

export const modelsColumns: ColumnDef<ModelTableColumns>[] = [
  { accessorKey: "id", header: "Id" },
  {
    accessorKey: "bucket_id",
    header: "Bucket",
  },
  {
    accessorKey: "bucket_name",
    header: "Bucket Name",
    cell: ({ row }) => {
      return (
        <p className="max-w-32 md:max-w-80 truncate">
          {row.getValue("bucket_name")}
        </p>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      return row.getValue("name");
    },
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }) => {
      return new Date(row.getValue("created_at")).toLocaleString();
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
                fetchUrl: "models",
                resourceId: row.getValue("id"),
                queryClient,
                queryKey: ["models"],
                isInfinite: false,
                globalErrors: errorDictionary,
              });
            }}
            resourceType="model"
            description="Are you sure you want to delete this model and the corresponding api key? This action cannot be undone."
          />
        </>
      );
    },
  },
];
