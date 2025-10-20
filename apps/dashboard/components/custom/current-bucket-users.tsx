"use client";

import { type User as AuthenticatedUser } from "@workspace/server/drizzle/schema";
import { Badge } from "@workspace/ui/components/badge";
import { memo } from "react";
import { type User } from "./autocomplete";

interface Props {
  currentUser: AuthenticatedUser;
  currentBucketUsers: User[];
  userCount: number;
}

export const CurrentBucketUsers = memo(
  ({ currentUser, currentBucketUsers, userCount }: Props) => {
    const remainingCount = userCount - currentBucketUsers.length;

    return (
      <div className="w-full rounded-md border p-2">
        <div className="flex h-fit min-h-20 w-full flex-wrap gap-2">
          {currentBucketUsers.map((user) => {
            return (
              <Badge key={user.id} className="h-6">
                {user.username}
                {currentUser.id === user.id && (
                  <span className="ml-1">(You)</span>
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
