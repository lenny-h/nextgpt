"use client";

import { useGlobalTranslations } from "@/contexts/dashboard-translations";
import { Button } from "@workspace/ui/components/button";
import { checkResponse } from "@workspace/ui/lib/translation-utils";
import { Loader2 } from "lucide-react";
import { memo, useState } from "react";
import { toast } from "sonner";
import { Autocomplete, type User } from "./autocomplete";

interface Props {
  bucketId: string;
  courseId?: string;
}

export const AddMaintainers = memo(({ bucketId, courseId }: Props) => {
  const { globalT } = useGlobalTranslations();

  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);

  function submitList() {
    setSubmitLoading(true);

    const addMaintainers = async () => {
      const response = await fetch(
        courseId
          ? `${process.env.NEXT_PUBLIC_API_URL}/capi/protected/course-maintainers/${courseId}`
          : `${process.env.NEXT_PUBLIC_API_URL}/capi/protected/bucket-maintainers/${bucketId}`,
        {
          method: "POST",
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

    toast.promise(addMaintainers(), {
      loading: globalT.components.addMaintainers.adding,
      success: () => {
        return globalT.components.addMaintainers.success;
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
    >
      <Button disabled={selectedUsers.length === 0} onClick={submitList}>
        Submit{submitLoading && <Loader2 className="animate-spin" />}
      </Button>
    </Autocomplete>
  );
});
