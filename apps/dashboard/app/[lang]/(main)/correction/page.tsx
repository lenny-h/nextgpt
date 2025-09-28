import { Correction } from "@/components/custom/correction";
import { type Locale } from "@/i18n.config";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";

export default async function CorrectionPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const lang = (await params).lang;

  return (
    <>
      <Button asChild className="absolute top-4 right-4">
        <Link href={`/${lang}/prompts`}>Manage prompts</Link>
      </Button>
      <Correction />
    </>
  );
}
