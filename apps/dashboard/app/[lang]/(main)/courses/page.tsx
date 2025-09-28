import { Courses } from "@/components/custom/courses";
import { type Locale } from "@/i18n.config";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";

export default async function CoursesPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const lang = (await params).lang;

  return (
    <>
      <Button asChild className="absolute top-4 right-4">
        <Link href={`/${lang}/courses/new`}>Create a course</Link>
      </Button>
      <Courses locale={lang} />
    </>
  );
}
