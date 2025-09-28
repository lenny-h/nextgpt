"use client";

import { AddPromptForm } from "@/components/custom/add-prompt-form";
import { CorrectionDropzone } from "@/components/custom/correction-dropzone";
import { UploadList } from "@/components/custom/upload-list";
import { useGlobalTranslations } from "@/contexts/global-translations";
import { useUser } from "@/contexts/user-context";
import { rpcFetcher } from "@/lib/fetcher";
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
import { checkResponse } from "@workspace/ui/lib/translation-utils";
import { Loader2 } from "lucide-react";
import { memo, useState } from "react";
import { toast } from "sonner";
import { Selector } from "./selector";

export const Correction = memo(() => {
  const { globalT } = useGlobalTranslations();
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
    data: prompts,
    isLoading: promptsLoading,
    error: promptsError,
  } = useQuery({
    queryKey: ["prompts"],
    queryFn: () => rpcFetcher<"get_user_prompts">("get_user_prompts"),
  });

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

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/capi/protected/correction`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            solutionFilename: user.id + "/" + solutionFile.name,
            handInFilenames: handInFiles.map(
              (file) => user.id + "/" + file.name,
            ),
            ...(promptId ? { promptId } : {}),
          }),
        },
      );

      checkResponse(response, globalT.globalErrors);

      const { failedFiles } = await response.json();

      if (failedFiles.length > 0) {
        toast.error(
          globalT.components.correction.filesNotCorrected +
            " " +
            failedFiles.join(", "),
        );
      } else {
        toast.success(globalT.components.correction.correctionSuccess);
      }
    } catch (error) {
      console.error("Correction failed:", error);
      toast.error(globalT.components.correction.correctionFailed);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6 p-2">
      <h1 className="text-2xl font-semibold">
        {globalT.components.correction.title}
      </h1>
      <div className="w-full max-w-4xl space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col items-center space-y-3">
            <h2 className="text-xl font-semibold">
              {globalT.components.correction.solutionSheet}
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
              {globalT.components.correction.studentHandIns}
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
              {globalT.components.correction.customPrompt}
            </h2>
            <p className="text-muted-foreground text-sm">
              {globalT.components.correction.customPromptDescription}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Selector
              items={prompts}
              selectedId={promptId}
              onSelect={setPromptId}
              isLoading={promptsLoading}
              error={promptsError}
              placeholder={globalT.components.correction.selectPrompt}
              searchPlaceholder={globalT.components.correction.searchPrompts}
              emptyMessage={globalT.components.correction.noPromptFound}
              errorMessage={globalT.components.correction.failedLoadPrompts}
              noItemsMessage={globalT.components.correction.noPromptsFound}
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
                    {globalT.components.correction.addNewPrompt}
                  </DialogTitle>
                  <DialogDescription>
                    {globalT.components.correction.addPromptDescription}
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
            {globalT.components.correction.startCorrection}
            {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          </Button>
        </div>
      </div>
    </div>
  );
});
