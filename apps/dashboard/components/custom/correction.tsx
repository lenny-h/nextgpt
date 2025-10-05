"use client";

import { useDashboardTranslations } from "@/contexts/dashboard-translations";
import { type Upload } from "@/types/upload";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { useUser } from "@workspace/ui/contexts/user-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { Loader2 } from "lucide-react";
import { memo, useState } from "react";
import { toast } from "sonner";
import { AddPromptForm } from "./add-prompt-form";
import { CorrectionDropzone } from "./correction-dropzone";
import { Selector } from "./selector";
import { UploadList } from "./upload-list";

export const Correction = memo(() => {
  const { sharedT } = useSharedTranslations();
  const { dashboardT } = useDashboardTranslations();

  const user = useUser();

  const [solutionUploads, setSolutionUploads] = useState<{
    [key: string]: Upload;
  }>({});
  const [handInUploads, setHandInUploads] = useState<{ [key: string]: Upload }>(
    {},
  );
  const [promptId, setPromptId] = useState<string | null>(null);
  const [addPromptDialogOpen, setAddPromptDialogOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const {
    data: promptsData,
    isLoading: promptsLoading,
    error: promptsError,
  } = useQuery({
    queryKey: ["prompts"],
    queryFn: () =>
      apiFetcher((client) => client["prompts"].$get(), sharedT.apiCodes),
  });

  const prompts = promptsData?.items;

  const canStartCorrection = () => {
    const successfulSolutionFiles = Object.values(solutionUploads).filter(
      (upload) => upload.state === "success",
    );
    const successfulHandInFiles = Object.values(handInUploads).filter(
      (upload) => upload.state === "success",
    );

    return (
      successfulSolutionFiles.length === 1 && successfulHandInFiles.length > 0
    );
  };

  const handleStartCorrection = async () => {
    const solutionFile = Object.values(solutionUploads).find(
      (upload) => upload.state === "success",
    );
    const handInFiles = Object.values(handInUploads).filter(
      (upload) => upload.state === "success",
    );

    if (!solutionFile || handInFiles.length === 0) return;

    try {
      setIsPending(true);

      const { failedFiles } = await apiFetcher(
        (client) =>
          client.correction.$post({
            json: {
              solutionFilename: user.id + "/" + solutionFile.name,
              handInFilenames: handInFiles.map(
                (file) => user.id + "/" + file.name,
              ),
              ...(promptId ? { promptId } : {}),
            },
          }),
        sharedT.apiCodes,
      );

      if (failedFiles.length > 0) {
        toast.error(
          dashboardT.correction.filesNotCorrected +
            " " +
            failedFiles.join(", "),
        );
      } else {
        toast.success(dashboardT.correction.correctionSuccess);
      }
    } catch (error) {
      console.error("Correction failed:", error);
      toast.error(dashboardT.correction.correctionFailed);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6 p-2">
      <h1 className="text-2xl font-semibold">{dashboardT.correction.title}</h1>
      <div className="w-full max-w-4xl space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col items-center space-y-3">
            <h2 className="text-xl font-semibold">
              {dashboardT.correction.solutionSheet}
            </h2>
            <div className="w-full space-y-6">
              <CorrectionDropzone
                onUploadChange={setSolutionUploads}
                maxFiles={1}
              />
              <UploadList uploads={solutionUploads} />
            </div>
          </div>
          <div className="flex flex-col items-center space-y-3">
            <h2 className="text-xl font-semibold">
              {dashboardT.correction.studentHandIns}
            </h2>
            <div className="w-full space-y-6">
              <CorrectionDropzone onUploadChange={setHandInUploads} />
              <UploadList uploads={handInUploads} />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="max-w-lg">
            <h2 className="text-xl font-semibold">
              {dashboardT.correction.customPrompt}
            </h2>
            <p className="text-muted-foreground text-sm">
              {dashboardT.correction.customPromptDescription}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Selector
              items={prompts}
              selectedId={promptId}
              onSelect={setPromptId}
              isLoading={promptsLoading}
              error={promptsError}
              placeholder={dashboardT.correction.selectPrompt}
              searchPlaceholder={dashboardT.correction.searchPrompts}
              emptyMessage={dashboardT.correction.noPromptFound}
              errorMessage={dashboardT.correction.failedLoadPrompts}
              noItemsMessage={dashboardT.correction.noPromptsFound}
            />

            <Dialog
              open={addPromptDialogOpen}
              onOpenChange={setAddPromptDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline">Add Prompt</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {dashboardT.correction.addNewPrompt}
                  </DialogTitle>
                  <DialogDescription>
                    {dashboardT.correction.addPromptDescription}
                  </DialogDescription>
                </DialogHeader>
                <AddPromptForm onClose={() => setAddPromptDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <Button
            onClick={handleStartCorrection}
            disabled={!canStartCorrection() || isPending}
          >
            {dashboardT.correction.startCorrection}
            {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          </Button>
        </div>
      </div>
    </div>
  );
});
