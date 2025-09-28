"use client";

import { type Locale } from "@/i18n.config";
import { filesColumns } from "../tables/files-columns";
import { FilesTasksTable } from "./files-tasks-table";

interface Props {
  locale: Locale;
}

export const Files = ({ locale }: Props) => {
  return (
    <FilesTasksTable
      locale={locale}
      resourceName="files"
      resourceProcedure="get_course_files"
      columns={filesColumns}
      visibilityState={{
        id: false,
        name: true,
        size: true,
        created_at: true,
      }}
      filterLabel="file name"
      filterColumn="name"
    />
  );
};
