"use client";

import { type Locale } from "@workspace/ui/lib/i18n.config";
import { filesColumns } from "../tables/files-columns";
import { FilesTasksTable } from "./files-tasks-table";
import { apiFetcher } from "@workspace/ui/lib/fetcher";

interface Props {
  locale: Locale;
}

export const Files = ({ locale }: Props) => {
  return (
    <FilesTasksTable
      locale={locale}
      resourceName="files"
      columns={filesColumns}
      visibilityState={{
        id: false,
        name: true,
        size: true,
        createdAt: true,
      }}
      filterLabel="file name"
      filterColumn="name"
    />
  );
};
