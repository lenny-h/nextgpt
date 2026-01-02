// Copyright 2024 Vercel, Inc.

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Modifications copyright (C) 2025 <Lennart Horn>

import { type Attachment } from "@workspace/api-routes/schemas/attachment-schema";
import { FileImage, FileText, Loader, X } from "lucide-react";

interface PreviewAttachmentProps {
  attachment: Attachment;
  isUploading?: boolean;
  onRemove?: () => void;
}

export const AttachmentPreview: React.FC<PreviewAttachmentProps> = ({
  attachment,
  isUploading = false,
  onRemove,
}) => {
  const { filename, contentType } = attachment;

  return (
    <div className="relative flex flex-col gap-1">
      <div className="bg-muted text-primary flex aspect-video h-16 w-12 flex-col items-center justify-center rounded-lg">
        {isUploading ? (
          <div className="animate-spin">
            <Loader />
          </div>
        ) : contentType && contentType.startsWith("image") ? (
          <FileImage />
        ) : (
          <FileText />
        )}
      </div>
      {!isUploading && onRemove && (
        <button
          onClick={onRemove}
          className="absolute cursor-pointer hover:text-red-500"
          aria-label="Remove attachment"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <div className="max-w-16 truncate text-xs">{filename}</div>
      <div className="text-muted-foreground max-w-16 truncate text-[10px] uppercase">
        {contentType?.toUpperCase()}
      </div>
    </div>
  );
};
