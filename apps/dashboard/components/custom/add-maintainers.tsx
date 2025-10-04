"use client";

import { useDashboardTranslations } from "@/contexts/dashboard-translations";
import { Button } from "@workspace/ui/components/button";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { Loader2 } from "lucide-react";
import { memo, useState } from "react";
import { toast } from "sonner";
import { Autocomplete, type User } from "./autocomplete";

interface Props {
  bucketId: string;
  courseId?: string;
}

export const AddMaintainers = memo(({ bucketId, courseId }: Props) => {
  const { sharedT } = useSharedTranslations();
  const { dashboardT } = useDashboardTranslations();

  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);

  function submitList() {
    setSubmitLoading(true);

    const addMaintainers = async () => {
      if (courseId) {
        await apiFetcher(
          (client) =>
            client["course-maintainers"][":courseId"].$post({
              param: { courseId },
              json: {
                userIds: selectedUsers.map((user) => user.id),
              },
            }),
          sharedT.apiCodes,
        );
      } else {
        await apiFetcher(
          (client) =>
            client["bucket-maintainers"][":bucketId"].$post({
              param: { bucketId },
              json: {
                userIds: selectedUsers.map((user) => user.id),
              },
            }),
          sharedT.apiCodes,
        );
      }

      setSubmitLoading(false);
    };

    toast.promise(addMaintainers(), {
      loading: dashboardT.addMaintainers.adding,
      success: () => {
        return dashboardT.addMaintainers.success;
      },
      error: (err) => {
        return `Error adding maintainers: ${err.message}`;
      },
    });
  }

  return (
    <Autocomplete
      selectedUsers={selectedUsers}
      setSelectedUsers={setSelectedUsers}
      userFetcher={async (prefix: string) =>
        apiFetcher(
          (client) =>
            client.profiles.ilike.$get({
              query: { prefix },
            }),
          sharedT.apiCodes,
        )
      }
    >
      <Button disabled={selectedUsers.length === 0} onClick={submitList}>
        Submit{submitLoading && <Loader2 className="animate-spin" />}
      </Button>
    </Autocomplete>
  );
});
