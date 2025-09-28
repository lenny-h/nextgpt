"use client";

import { type User as SupabaseUser } from "@supabase/supabase-js";
import { Badge } from "@workspace/ui/components/badge";
import { User } from "./autocomplete";
import { memo } from "react";

interface Props {
  currentUser: SupabaseUser;
  currentBucketUsers: User[];
  usersCount: number;
}

export const CurrentBucketUsers = memo(
  ({ currentUser, currentBucketUsers, usersCount }: Props) => {
    const remainingCount = usersCount - currentBucketUsers.length;

    return (
      <div className="w-full rounded-md border p-2">
        <div className="flex h-fit min-h-20 w-full flex-wrap gap-2">
          {currentBucketUsers.map((user) => {
            return (
              <Badge key={user.id} className="h-6">
                {user.username}
                {currentUser.id === user.id && (
                  <span className="text-primary ml-2">(You)</span>
                )}
              </Badge>
            );
          })}
          {remainingCount > 0 && (
            <Badge variant="secondary" className="h-6">
              ...and {remainingCount} others
            </Badge>
          )}
        </div>
      </div>
    );
  },
);
