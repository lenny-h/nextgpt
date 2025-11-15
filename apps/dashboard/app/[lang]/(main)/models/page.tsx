"use client";

import { Models } from "@/components/custom/models";
import { useDashboardTranslations } from "@/contexts/dashboard-translations";
import { Button } from "@workspace/ui/components/button";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import Link from "next/link";

export default function ModelsPage() {
  const { locale } = useSharedTranslations();
  const { dashboardT } = useDashboardTranslations();

  return (
    <>
      <Button asChild className="absolute right-4 top-4">
        <Link href={`/${locale}/models/new`}>{dashboardT.models.add}</Link>
      </Button>
      <Models />
    </>
  );
}
