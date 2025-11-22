"use client";

import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { CentralLoadingScreen } from "@workspace/ui/custom-components/central-loading-screen";
import { client } from "@workspace/ui/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { data, isPending } = client.useSession();
  const { locale } = useSharedTranslations();

  const router = useRouter();

  useEffect(() => {
    if (!isPending && data?.user) {
      router.push(`/${locale}`);
    }
  }, [data, isPending, locale]);

  if (isPending || data?.user) {
    return <CentralLoadingScreen />;
  }

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
