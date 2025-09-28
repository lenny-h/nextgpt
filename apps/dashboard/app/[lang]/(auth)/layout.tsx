import { client } from "@workspace/ui/lib/auth-client";
import { type Locale } from "@workspace/ui/lib/i18n.config";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: Locale }>;
}) {
  const lang = (await params).lang;

  const { data } = await client.getSession();

  if (data?.user) {
    return redirect(`/${lang}/buckets`);
  }

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
