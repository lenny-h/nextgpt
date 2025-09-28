import { Files } from "@/components/custom/files";
import { type Locale } from "@/i18n.config";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";

export default async function FilePage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const lang = (await params).lang;

  return (
    <>
      <Button asChild className="absolute top-4 right-4">
        <Link href={`/${lang}/files/new`}>Upload files</Link>
      </Button>
      <Files locale={lang} />
    </>
  );
}
