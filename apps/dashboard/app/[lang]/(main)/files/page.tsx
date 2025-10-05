import { Files } from "@/components/custom/files";
import { Button } from "@workspace/ui/components/button";
import { Locale } from "@workspace/ui/lib/i18n.config";
import Link from "next/link";

export default async function FilePage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const lang = (await params).lang;

  return (
    <>
      <Button asChild className="absolute right-4 top-4">
        <Link href={`/${lang}/files/new`}>Upload files</Link>
      </Button>
      <Files locale={lang} />
    </>
  );
}
