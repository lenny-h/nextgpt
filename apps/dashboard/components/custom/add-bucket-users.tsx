import { Button } from "@workspace/ui/components/button";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { Loader2 } from "lucide-react";
import { memo, useState } from "react";
import { toast } from "sonner";
import { Autocomplete, type User } from "./autocomplete";

interface Props {
  bucketId: string;
}

export const AddBucketUsers = memo(({ bucketId }: Props) => {
  const { sharedT } = useSharedTranslations();

  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);

  const submitList = async () => {
    if (!bucketId) {
      toast.error("Bucket ID is required");
      return;
    }

    setSubmitLoading(true);

    const inviteUsers = async () => {
      await apiFetcher(
        (client) =>
          client["bucket-users"][":bucketId"].$post({
            param: { bucketId },
            json: {
              userIds: selectedUsers.map((user) => user.id),
            },
          }),
        sharedT.apiCodes,
      );

      setSubmitLoading(false);
      setSelectedUsers([]);
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
