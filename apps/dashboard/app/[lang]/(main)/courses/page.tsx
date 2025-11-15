"use client";

import { Courses } from "@/components/custom/courses";
import { useDashboardTranslations } from "@/contexts/dashboard-translations";
import { Button } from "@workspace/ui/components/button";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import Link from "next/link";

export default function CoursesPage() {
  const { locale } = useSharedTranslations();
  const { dashboardT } = useDashboardTranslations();

  return (
    <>
      <Button asChild className="absolute right-4 top-4">
        <Link href={`/${locale}/courses/new`}>
          {dashboardT.courses.createCourse}
        </Link>
      </Button>
      <Courses />
    </>
  );
}
