import { useGlobalTranslations } from "@/contexts/global-translations";
import { Button } from "@workspace/ui/components/button";
import { checkResponse } from "@workspace/ui/lib/translation-utils";
import { Loader2 } from "lucide-react";
import { memo, useState } from "react";
import { toast } from "sonner";
import { Autocomplete, type User } from "./autocomplete";

interface Props {
  bucketId: string;
}

export const AddBucketUsers = memo(({ bucketId }: Props) => {
  const { globalT } = useGlobalTranslations();

  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);

  const submitList = async () => {
    setSubmitLoading(true);

    const inviteUsers = async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/capi/protected/bucket-users/${bucketId}`,
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

    toast.promise(inviteUsers(), {
      loading: "Inviting users...",
      success: () => {
        return `Users invited successfully 🎉`;
      },
      error: (err) => {
        return `Error inviting users: ${err.message}`;
      },
    });
  };

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
