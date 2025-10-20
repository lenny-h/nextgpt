"use client";

import { type User as AuthenticatedUser } from "@workspace/server/drizzle/schema";
import { Badge } from "@workspace/ui/components/badge";
import { memo } from "react";
import { type User } from "./autocomplete";

interface Props {
  currentUser: AuthenticatedUser;
  currentMaintainers: User[];
}

export const CurrentMaintainers = memo(
  ({ currentUser, currentMaintainers }: Props) => {
    return (
      <div className="w-full rounded-md border p-2">
        <div className="flex h-fit min-h-20 w-full flex-wrap gap-2">
          {currentMaintainers.map((maintainer) => {
            return (
              <Badge key={maintainer.id} className="h-6">
                {maintainer.username}
                {currentUser.id === maintainer.id && (
                  <span className="ml-1">(You)</span>
                )}
              </Badge>
            );
          })}
        </div>
      </div>
    );
  },
);
