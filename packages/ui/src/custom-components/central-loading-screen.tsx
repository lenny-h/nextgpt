export const CentralLoadingScreen = () => {
  return (
    <div className="bg-background flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  );
};
