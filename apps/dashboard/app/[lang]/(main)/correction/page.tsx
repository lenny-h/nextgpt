import { Correction } from "@/components/custom/correction";
import { Button } from "@workspace/ui/components/button";
import { type Locale } from "@workspace/ui/lib/i18n.config";
import Link from "next/link";

export default async function CorrectionPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const lang = (await params).lang;

  return (
    <>
      <Button asChild className="absolute right-4 top-4">
        <Link href={`/${lang}/prompts`}>Manage prompts</Link>
      </Button>
      <Correction />
    </>
  );
}
