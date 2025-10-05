"use client";

import { type QueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { apiFetcher, updateCache } from "@workspace/ui/lib/fetcher";
import { type ErrorDictionary } from "@workspace/ui/lib/translation-utils";
import { useState } from "react";
import { DeleteDialog } from "../custom/delete-dialog";
import { deleteResource } from "@/lib/delete-resource";

export type PromptTableColumns = {
  id: string;
  name: string;
  content: string;
};

export const promptsColumns: ColumnDef<PromptTableColumns>[] = [
  { accessorKey: "id", header: "Id" },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "content",
    header: "View prompt",
    cell: ({ row }) => {
      const [viewPromptDialog, setViewPromptDialog] = useState(false);

      return (
        <>
          <Button onClick={() => setViewPromptDialog(true)} variant="outline">
            View
          </Button>
          <Dialog open={viewPromptDialog} onOpenChange={setViewPromptDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>View {row.getValue("name")}</DialogTitle>
              </DialogHeader>
              {row.getValue("content")}
            </DialogContent>
          </Dialog>
        </>
      );
    },
  },
  {
    id: "delete",
    header: "Delete",
    cell: ({ row }) => {
      const [deleteDialog, setDeleteDialog] = useState(false);

      return (
        <>
          <Button onClick={() => setDeleteDialog(true)} variant="outline">
            Delete
          </Button>
          <DeleteDialog
            open={deleteDialog}
            setOpen={setDeleteDialog}
            deleteResource={(queryClient, errorDictionary) => {
              setDeleteDialog(false);
              return deleteResource({
                deletePromise: apiFetcher(
                  (client) =>
                    client["prompts"][":promptId"].$delete({
                      param: { promptId: row.getValue("id") },
                    }),
                  errorDictionary,
                ),
                resourceId: row.getValue("id"),
                queryClient,
                queryKey: ["tasks"],
                isInfinite: true,
              });
            }}
            resourceType="prompt"
            description="Are you sure you want to delete this prompt? This action cannot be undone."
          />
        </>
      );
    },
  },
];
