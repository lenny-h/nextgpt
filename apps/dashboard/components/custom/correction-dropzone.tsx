"use client";

import { useDashboardTranslations } from "@/contexts/dashboard-translations";
import { useCorrectionDropzone } from "@/hooks/use-correction-dropzone";
import { type Upload } from "@/types/upload";
import { cn } from "@workspace/ui/lib/utils";
import { memo } from "react";

interface Props {
  onUploadChange?: (uploads: { [key: string]: Upload }) => void;
  maxFiles?: number;
}

export const CorrectionDropzone = memo(
  ({ onUploadChange, maxFiles }: Props) => {
    const { dashboardT } = useDashboardTranslations();

    const { getRootProps, getInputProps, isDragActive } = useCorrectionDropzone(
      { onUploadChange, maxFiles },
    );

    return (
      <div
        {...getRootProps()}
        className={cn(
          "flex h-56 w-full flex-row items-center justify-center rounded-md border border-dashed shadow-md",
          "bg-primary/40 hover:bg-primary-60 cursor-pointer",
        )}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-primary">
            {dashboardT.correctionDropzone.dropFiles}
          </p>
        ) : (
          <div className="flex flex-col gap-5 px-2">
            <p className="text-primary text-center">
              {dashboardT.correctionDropzone.dragDrop}
            </p>
            <p className="text-muted-foreground text-center">
              {dashboardT.correctionDropzone.maxFiles.replace(
                "{maxFiles}",
                (maxFiles ?? 5).toString(),
              )}
            </p>
          </div>
        )}
      </div>
    );
  },
);
