"use client";

import { useGlobalTranslations } from "@/contexts/global-translations";
import {
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { memo } from "react";

export const LocaleSwitcher = memo(() => {
  const { locale } = useGlobalTranslations();

  const pathName = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const redirectedPathName = (newLocale: string) => {
    if (!pathName) return "/";

    const segments = pathName.split("/");
    segments[1] = newLocale;

    return segments.join("/");
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="text-sm">
        Languages
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup
            value={locale}
            onValueChange={(locale) =>
              router.push(`${redirectedPathName(locale)}?${searchParams}`)
            }
          >
            <DropdownMenuRadioItem value="de">Deutsch</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
});
