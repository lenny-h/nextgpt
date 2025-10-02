"use client";

import { useGlobalTranslations } from "@/contexts/global-translations";
import { type User as AuthenticatedUser } from "@workspace/server/drizzle/schema";
import { Button } from "@workspace/ui/components/button";
import { checkResponse } from "@workspace/ui/lib/translation-utils";
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
  const { globalT } = useGlobalTranslations();

  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);

  function submitList() {
    setSubmitLoading(true);

    const removeMaintainers = async () => {
      const response = await fetch(
        courseId
          ? `/api/course-maintainers/${courseId}`
          : `/api/bucket-maintainers/${bucketId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            userIds: selectedUsers.map((user) => user.id),
          }),
        },
      );

      setSubmitLoading(false);

      checkResponse(response, globalT.globalErrors);
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
