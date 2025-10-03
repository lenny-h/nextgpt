"use client";

import {
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { useTheme } from "next-themes";
import { memo, useEffect, useState, useTransition } from "react";

export const ThemeSwitcher = memo(() => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [_, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="text-sm">
        Themes
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup
            value={theme}
            onValueChange={(theme) => startTransition(() => setTheme(theme))}
          >
            <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
});
