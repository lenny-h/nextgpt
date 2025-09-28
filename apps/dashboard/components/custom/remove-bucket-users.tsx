"use client";

import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Autocomplete, type User } from "./autocomplete";

interface Props {
  bucketId: string;
}

export function RemoveBucketUsers({ bucketId }: Props) {
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
    setSubmitLoading(true);

    const removeBucketUsers = async () => {
      const supabase = createClient();

      const { data, error } = await supabase.rpc("remove_bucket_users", {
        p_bucket_id: bucketId,
        p_user_ids: selectedUsers.map((user) => user.id),
      });

      if (error || !data) throw error;

      setSubmitLoading(false);

      // Clear selected users and invalidate the query
      setSelectedUsers([]);
      queryClient.invalidateQueries({ queryKey: ["buckets"] });
      queryClient.invalidateQueries({ queryKey: ["bucket_users", bucketId] });

      decreaseUsersCount(data);

      return data;
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
      rpc="ilike_bucket_users"
      bucketId={bucketId}
    >
      <Button disabled={selectedUsers.length === 0} onClick={submitList}>
        Submit{submitLoading && <Loader2 className="animate-spin" />}
      </Button>
    </Autocomplete>
  );
}
