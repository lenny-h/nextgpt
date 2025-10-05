import { Courses } from "@/components/custom/courses";
import { Button } from "@workspace/ui/components/button";
import { type Locale } from "@workspace/ui/lib/i18n.config";
import Link from "next/link";

export default async function CoursesPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const lang = (await params).lang;

  return (
    <>
      <Button asChild className="absolute right-4 top-4">
        <Link href={`/${lang}/courses/new`}>Create a course</Link>
      </Button>
      <Courses locale={lang} />
    </>
  );
}
