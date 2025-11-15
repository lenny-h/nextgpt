"use client";

import { Correction } from "@/components/custom/correction";
import { useDashboardTranslations } from "@/contexts/dashboard-translations";
import { Button } from "@workspace/ui/components/button";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import Link from "next/link";

export default function CorrectionPage() {
  const { locale } = useSharedTranslations();
  const { dashboardT } = useDashboardTranslations();

  return (
    <>
      <Button asChild className="absolute right-4 top-4">
        <Link href={`/${locale}/prompts`}>{dashboardT.prompts.manage}</Link>
      </Button>
      <Correction />
    </>
  );
}
