"use client";

import { useGlobalTranslations } from "@/contexts/global-translations";
import { deleteResource } from "@/lib/delete-resource";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DeleteDialogWithConfirmation } from "../custom/delete-dialog-with-confirmation";

export type CourseTableColumns = {
  id: string;
  name: string;
  description: string;
  bucket_id: string;
  bucket_name: string;
  created_at: string;
  private: boolean;
};

export const coursesColumns: ColumnDef<CourseTableColumns>[] = [
  { accessorKey: "id", header: "Id" },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <p className="max-w-32 md:max-w-80 truncate">{row.getValue("name")}</p>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <p className="max-w-32 md:max-w-80 truncate">
        {row.getValue("description")}
      </p>
    ),
  },
  {
    accessorKey: "bucket_id",
    header: "Bucket",
  },
  {
    accessorKey: "bucket_name",
    header: "Bucket Name",
    cell: ({ row }) => (
      <p className="max-w-32 md:max-w-80 truncate">
        {row.getValue("bucket_name")}
      </p>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }) => {
      return new Date(row.getValue("created_at")).toLocaleString();
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
      const { locale } = useGlobalTranslations();

      const router = useRouter();

      const [deleteDialog, setDeleteDialog] = useState(false);

      const handleAddMaintainers = () => {
        const searchParams = new URLSearchParams();
        searchParams.set("courseId", row.getValue("id"));
        searchParams.set("courseName", row.getValue("name"));
        searchParams.set("bucketId", row.getValue("bucket_id"));
        router.push(
          `/${locale}/courses/maintainers?${searchParams.toString()}`
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
                fetchUrl: "courses",
                resourceId: row.getValue("id"),
                queryClient,
                queryKey: ["courses"],
                isInfinite: true,
                globalErrors: errorDictionary,
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
