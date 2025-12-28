"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Autocomplete, type User } from "./autocomplete";

interface Props {
  bucketId: string;
}

export function RemoveBucketUsers({ bucketId }: Props) {
  const { sharedT } = useSharedTranslations();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);

  function decreaseUsersCount(count: number) {
    const params = new URLSearchParams(searchParams);
    const currentCount = parseInt(params.get("users_count") || "0");
    const newCount = Math.max(0, currentCount - count);
    params.set("users_count", newCount.toString());
    router.replace(`?${params.toString()}`);
  }

  function submitList() {
    if (!bucketId) {
      toast.error("Bucket ID is required");
      return;
    }

    setSubmitLoading(true);

    const removeBucketUsers = async () => {
      await apiFetcher(
        (client) =>
          client["bucket-users"][":bucketId"].$delete({
            param: { bucketId },
            json: {
              userIds: selectedUsers.map((user) => user.id),
            },
          }),
        sharedT.apiCodes,
      );

      setSubmitLoading(false);

      const removedCount = selectedUsers.length;

      // Clear selected users and invalidate the query
      setSelectedUsers([]);
      queryClient.invalidateQueries({ queryKey: ["buckets"] });
      queryClient.invalidateQueries({ queryKey: ["bucket_users", bucketId] });

      decreaseUsersCount(removedCount);

      return removedCount;
    };

    toast.promise(removeBucketUsers(), {
      loading: "Removing users...",
      success: (removedCount) => {
        return `Removed ${removedCount} users successfully 🎉`;
      },
      error: (err) => {
        return `Error removing users: ${err.message}`;
      },
    });
  }

  return (
    <Autocomplete
      selectedUsers={selectedUsers}
      setSelectedUsers={setSelectedUsers}
      shortcut="#"
      userFetcher={(prefix: string) =>
        apiFetcher(
          (client) =>
            client["bucket-users"]["ilike"][":bucketId"].$get({
              param: { bucketId },
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
}
