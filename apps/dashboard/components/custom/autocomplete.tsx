"use client";

import { useDashboardTranslations } from "@/contexts/dashboard-translations";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { Loader2, Plus, X } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";

export type User = {
  id: string;
  username: string;
};

interface Props {
  children: React.ReactNode;
  selectedUsers: User[];
  setSelectedUsers: (users: User[] | ((prev: User[]) => User[])) => void;
  userFetcher: (prefix: string) => Promise<{ users: User[] }>;
  shortcut?: string;
  selection?: User[];
}

export const Autocomplete = memo(
  ({
    children,
    selectedUsers,
    setSelectedUsers,
    shortcut = "/",
    selection,
    userFetcher,
  }: Props) => {
    const { dashboardT } = useDashboardTranslations();

    const isMobile = useIsMobile();

    const inputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState("");
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
      if (!isMobile) {
        const handleKeyPress = (e: KeyboardEvent) => {
          if (
            e.key === shortcut &&
            document.activeElement !== inputRef.current
          ) {
            e.preventDefault();
            inputRef.current?.focus();
          }
        };

        document.addEventListener("keydown", handleKeyPress);

        return () => {
          document.removeEventListener("keydown", handleKeyPress);
        };
      }
    }, [isMobile, shortcut]);

    useEffect(() => {
      const delayDebounce = setTimeout(
        () => {
          if (inputValue.trim().length > 2) {
            if (selection) {
              filterLocalUsers(inputValue);
            } else {
              fetchUsers(inputValue);
            }
          } else if (inputValue.trim().length === 0) {
            setUsers([]);
          }
        },
        selection ? 0 : 250,
      );

      return () => clearTimeout(delayDebounce);
    }, [inputValue, selection]);

    const filterLocalUsers = (searchTerm: string) => {
      if (!selection) return;

      const filtered = selection.filter((user) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setUsers(filtered);
    };

    const fetchUsers = async (prefix: string) => {
      setIsLoading(true);

      const usersData = await userFetcher(prefix);

      setIsLoading(false);

      setUsers(usersData.users);
    };

    return (
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="space-y-4">
          <div className="relative">
            <Input
              ref={inputRef}
              value={inputValue}
              placeholder={dashboardT.autocomplete.searchUsers}
              onChange={(e) => setInputValue(e.target.value)}
            />
            {isLoading ? (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin">
                <Loader2 size={12} />
              </div>
            ) : (
              <div className="text-muted-foreground absolute right-2 top-1/2 hidden size-5 -translate-y-1/2 items-center justify-center border md:flex">
                <span className="text-xs">{shortcut}</span>
              </div>
            )}
          </div>
          <ul className="h-32 space-y-2 overflow-y-auto xl:h-auto xl:overflow-y-visible">
            {users.map((user) => (
              <li
                key={user.id}
                className="bg-accent/70 flex items-center justify-between rounded-md px-2 py-1 text-sm"
              >
                {user.username}
                <Button
                  size={"sm"}
                  variant={"ghost"}
                  onClick={() => setSelectedUsers((prev) => [...prev, user])}
                  disabled={selectedUsers.includes(user)}
                >
                  <Plus />
                </Button>
              </li>
            ))}
          </ul>
        </div>
        <div className="w-full rounded-md border p-2">
          <div className="flex h-fit min-h-20 w-full flex-wrap gap-2">
            {selectedUsers.map((user) => (
              <Badge key={user.id} className="h-6">
                {user.username}
                <button
                  className="text-muted-foreground hover:text-destructive ml-2 cursor-pointer"
                  onClick={() =>
                    setSelectedUsers((prev) => prev.filter((u) => u !== user))
                  }
                >
                  <X size={12} />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex w-full justify-end">{children}</div>
        </div>
      </div>
    );
  },
);
