import { Buckets } from "@/components/custom/buckets";
import { type Locale } from "@/i18n.config";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";

export default async function BucketsPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const lang = (await params).lang;

  return (
    <>
      <Button asChild className="absolute top-4 right-4">
        <Link href={`/${lang}/buckets/new`}>Create a bucket</Link>
      </Button>
      <Buckets locale={lang} />
    </>
  );
}
