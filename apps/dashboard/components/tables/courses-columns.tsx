"use client";

import { deleteResource } from "@/lib/delete-resource";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DeleteDialogWithConfirmation } from "../custom/delete-dialog-with-confirmation";

export type CourseTableColumns = {
  id: string;
  name: string;
  description: string | null;
  bucketId: string;
  bucketName: string;
  createdAt: string;
  private: boolean;
};

export const coursesColumns: ColumnDef<CourseTableColumns>[] = [
  { accessorKey: "id", header: "Id" },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <p className="max-w-32 truncate md:max-w-80">{row.getValue("name")}</p>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <p className="max-w-32 truncate md:max-w-80">
        {row.getValue("description")}
      </p>
    ),
  },
  {
    accessorKey: "bucketId",
    header: "Bucket",
  },
  {
    accessorKey: "bucketName",
    header: "Bucket Name",
    cell: ({ row }) => (
      <p className="max-w-32 truncate md:max-w-80">
        {row.getValue("bucketName")}
      </p>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      return new Date(row.getValue("createdAt")).toLocaleString();
    },
  },
  {
    accessorKey: "private",
    header: "Password",
    cell: ({ row }) => (row.getValue("private") ? "Yes" : "No"),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { locale } = useSharedTranslations();

      const router = useRouter();

      const [deleteDialog, setDeleteDialog] = useState(false);

      const handleAddMaintainers = () => {
        const searchParams = new URLSearchParams();
        searchParams.set("courseId", row.getValue("id"));
        searchParams.set("courseName", row.getValue("name"));
        searchParams.set("bucketId", row.getValue("bucketId"));
        router.push(
          `/${locale}/courses/maintainers?${searchParams.toString()}`,
        );
      };

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
                className="cursor-pointer"
                onClick={handleAddMaintainers}
              >
                <Plus />
                <span>Maintainers</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-red-500 focus:text-red-400"
                onClick={() => setDeleteDialog(true)}
              >
                <Trash2 />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DeleteDialogWithConfirmation
            open={deleteDialog}
            setOpen={setDeleteDialog}
            deleteResource={(queryClient, errorDictionary) => {
              setDeleteDialog(false);
              return deleteResource({
                deletePromise: apiFetcher(
                  (client) =>
                    client["courses"][":courseId"].$delete({
                      param: { courseId: row.getValue("id") },
                    }),
                  errorDictionary,
                ),
                resourceId: row.getValue("id"),
                queryClient,
                queryKey: ["courses"],
                isInfinite: true,
              });
            }}
            resourceType="course"
            resourceName={row.getValue("name")}
            description="Are you sure you want to delete this course? This action cannot be undone. This will permanently delete the course and all associated files."
          />
        </>
      );
    },
  },
];
