"use client";

import { useDropzoneHook } from "@/hooks/use-dropzone";
import { cn } from "@workspace/ui/lib/utils";
import { memo } from "react";
import { UploadList } from "./upload-list";

interface Props {
  courseId: string;
  processingDate?: Date;
  pdfPipelineOptions?: {
    do_ocr: boolean;
    do_code_enrichment: boolean;
    do_formula_enrichment: boolean;
    do_picture_description: boolean;
  };
}

export const Dropzone = memo(
  ({ courseId, processingDate, pdfPipelineOptions }: Props) => {
    const { getRootProps, getInputProps, isDragActive, uploads } =
      useDropzoneHook({ courseId, processingDate, pdfPipelineOptions });

  return (
    <div className="flex w-full max-w-2xl flex-col items-center space-y-6">
      <div
        {...getRootProps()}
        className={cn(
          "flex h-64 w-full flex-row items-center justify-center rounded-md border border-dashed shadow-md",
          !courseId
            ? "bg-muted"
            : "bg-primary/40 hover:bg-primary-60 cursor-pointer",
        )}
      >
        <input {...getInputProps()} disabled={!courseId} />
        {!courseId ? (
          <p className="text-muted-foreground">
            Disabled: Select a course first
          </p>
        ) : isDragActive ? (
          <p className="text-primary">Drop the files here ...</p>
        ) : (
          <div className="flex flex-col gap-5 px-2">
            <p className="text-primary text-center">
              Drag and drop .pdf files here, or click to select files
            </p>
            <p className="text-muted-foreground text-center">
              Max 5 files with 15 MB each
            </p>
            {processingDate && (
              <p className="text-primary text-center">
                Files will be processed on: {processingDate.toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>
      <div className="grid w-full gap-3">
        {Object.keys(uploads).length > 0 && <UploadList uploads={uploads} />}
      </div>
    </div>
  );
  },
);
