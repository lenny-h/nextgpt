import { Models } from "@/components/custom/models";
import { type Locale } from "@/i18n.config";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";

export default async function ModelsPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const lang = (await params).lang;

  return (
    <>
      <Button asChild className="absolute top-4 right-4">
        <Link href={`/${lang}/models/new`}>Add models</Link>
      </Button>
      <Models locale={lang} />
    </>
  );
}
