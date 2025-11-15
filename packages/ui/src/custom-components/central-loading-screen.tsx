import { useSharedTranslations } from "../contexts/shared-translations-context";

export const CentralLoadingScreen = () => {
  const { sharedT } = useSharedTranslations();

  return (
    <div className="bg-background flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
        <p className="text-muted-foreground text-sm">
          {sharedT.centralLoading.loading}
        </p>
      </div>
    </div>
  );
};
