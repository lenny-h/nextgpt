import { type Upload } from "@/types/upload";
import { Progress } from "@workspace/ui/components/progress";
import { cn } from "@workspace/ui/lib/utils";
import { CircleCheck, CircleX, FileUp } from "lucide-react";

export const UploadList = ({
  uploads,
}: {
  uploads: { [key: string]: Upload };
}) => (
  <div className="max-h-96 min-h-40 space-y-2 overflow-y-auto rounded-md border p-3 shadow-md">
    {Object.values(uploads).map((upload) => (
      <div
        key={upload.id}
        className={cn("flex items-center gap-2 rounded-md border p-2", {
          "bg-green-100 dark:bg-green-800": upload.state === "success",
          "bg-red-100 dark:bg-red-800": upload.state === "failure",
          "bg-blue-100 dark:bg-blue-800": upload.state === "uploading",
        })}
      >
        <FileUp className="size-5" />
        <div className="flex flex-1 flex-col gap-1">
          <p className="text-sm">{upload.name}</p>
          {upload.state === "uploading" ? (
            <Progress value={upload.progress} className="w-3/5" />
          ) : (
            <p className="text-xs">
              {upload.state === "success" ? (
                <span className="text-emerald-500">Uploaded successfully</span>
              ) : (
                <span className="text-red-500">
                  Upload failed: {upload.error}
                </span>
              )}
            </p>
          )}
        </div>
        {upload.state === "uploading" ? (
          <div className="text-muted-foreground mr-2 h-5 w-8">
            {upload.progress}%
          </div>
        ) : upload.state === "success" ? (
          <CircleCheck className="size-5 text-emerald-500" />
        ) : (
          <CircleX className="size-5 text-red-500" />
        )}
      </div>
    ))}
  </div>
);
