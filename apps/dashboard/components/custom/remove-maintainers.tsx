"use client";

import { type User as AuthenticatedUser } from "@workspace/server/drizzle/schema";
import { Button } from "@workspace/ui/components/button";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Autocomplete, type User } from "./autocomplete";

interface Props {
  bucketId: string;
  courseId?: string;
  currentUser: AuthenticatedUser;
  currentMaintainers: User[];
}

export function RemoveMaintainers({
  bucketId,
  courseId,
  currentUser,
  currentMaintainers,
}: Props) {
  const { sharedT } = useSharedTranslations();

  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);

  function submitList() {
    setSubmitLoading(true);

    const removeMaintainers = async () => {
      if (courseId) {
        await apiFetcher(
          (client) =>
            client["course-maintainers"][":courseId"].$delete({
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
            client["bucket-maintainers"][":bucketId"].$delete({
              param: { bucketId },
              json: {
                userIds: selectedUsers.map((user) => user.id),
              },
            }),
          sharedT.apiCodes,
        );
      }

      setSubmitLoading(false);
      setSelectedUsers([]);
    };

    toast.promise(removeMaintainers(), {
      loading: "Removing maintainers...",
      success: () => {
        return `Maintainters removed successfully 🎉`;
      },
      error: (err) => {
        return `Error removing maintainers: ${err.message}`;
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
      shortcut="#"
      selection={currentMaintainers.filter(
        (user) => user.id !== currentUser.id,
      )}
    >
      <Button disabled={selectedUsers.length === 0} onClick={submitList}>
        Submit{submitLoading && <Loader2 className="animate-spin" />}
      </Button>
    </Autocomplete>
  );
}
