"use client";

import { type User as SupabaseUser } from "@supabase/supabase-js";
import { Badge } from "@workspace/ui/components/badge";
import { User } from "./autocomplete";
import { memo } from "react";

interface Props {
  currentUser: SupabaseUser;
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
                  <span className="text-primary ml-2">(You)</span>
                )}
              </Badge>
            );
          })}
        </div>
      </div>
    );
  },
);
