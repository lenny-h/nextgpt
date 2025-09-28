"use client";

import { type Locale } from "@/i18n.config";
import { tasksColumns } from "../tables/tasks-columns";
import { FilesTasksTable } from "./files-tasks-table";

interface Props {
  locale: Locale;
}

export const Tasks = ({ locale }: Props) => {
  return (
    <FilesTasksTable
      locale={locale}
      resourceName="tasks"
      resourceProcedure="get_course_tasks"
      columns={tasksColumns}
      visibilityState={{
        id: false,
        name: true,
        status: true,
        created_at: true,
        pub_date: true,
      }}
      filterLabel="task name"
      filterColumn="name"
    />
  );
};
