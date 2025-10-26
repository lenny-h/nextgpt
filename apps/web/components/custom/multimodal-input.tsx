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

// Modifications copyright (C) 2025 <NextGpt.ai Technologies>

"use client";

import { useFilter } from "@/contexts/filter-context";
import { useChatModel } from "@/contexts/selected-chat-model";
import { useIsTemporary } from "@/contexts/temporary-chat-context";
import { useDocumentHandler } from "@/hooks/use-document-handler";
import { useFileUpload } from "@/hooks/use-file-upload";
import { stripFilter } from "@/lib/utils";
import { Attachment } from "@workspace/api-routes/schemas/attachment-schema";
import { type MyUIMessage } from "@workspace/api-routes/types/custom-ui-message";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { cn, generateUUID } from "@workspace/ui/lib/utils";
import { type ChatRequestOptions } from "ai";
import React, {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { toast } from "sonner";
import { useLocalStorage } from "usehooks-ts";
import { AttachmentPreview } from "./attachment-preview";
import { ContextFiles } from "./context-files";
import { Textarea } from "./text-area";
import { TextAreaControl } from "./text-area-control";

interface MultimodalInputProps {
  sendMessage: (
    message: MyUIMessage,
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<void>;
  chatId: string;
  input: string;
  setInput: (value: string) => void;
  status: "error" | "ready" | "submitted" | "streaming";
  stop: () => void;
  isPractice?: boolean;
}

const PureMultimodalInput = ({
  sendMessage,
  chatId,
  input,
  setInput,
  status,
  stop,
  isPractice = false,
}: MultimodalInputProps) => {
  const { locale } = useSharedTranslations();

  const { filter } = useFilter();
  const { selectedChatModel, reasoningEnabled } = useChatModel();
  const [isTemporary] = useIsTemporary();

  const { uploadQueue, handleFileChange } = useFileUpload();
  const { handleDocumentClick } = useDocumentHandler();
  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    "input",
    "",
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      setInput(domValue || localStorageInput || "");
    }
  }, []);

  const handleRemoveAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleVoiceInput = useCallback(
    (transcript: string) => {
      const newValue = input ? input + transcript : transcript;

      setInput(newValue);
      setLocalStorageInput(newValue);

      textareaRef.current?.focus();
    },
    [input, setInput, setLocalStorageInput],
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Create a synthetic event to reuse the existing onFileChange handler
      const fileList = e.dataTransfer.files;
      const event = {
        target: {
          files: fileList,
        },
      } as ChangeEvent<HTMLInputElement>;

      handleFileChange(event, setAttachments);
    }
  };

  const submitForm = useCallback(() => {
    if (!filter.bucket.id) {
      toast.error("Please select a bucket before submitting your question");
      return;
    }

    const path = isPractice ? "practice" : "chat";

    window.history.replaceState({}, "", `/${locale}/${path}/${chatId}`);

    if ("documents" in filter && filter.documents.length > 0) {
      const document = filter.documents[0];

      if (!document) {
        toast.error("Document not found in the filter");
        return;
      }

      handleDocumentClick(document.id, document.title, document.kind);
    }

    sendMessage({
      id: generateUUID(),
      role: "user",
      parts: [{ type: "text", text: input }],
      metadata: {
        filter: stripFilter(filter, false),
        attachments,
      },
    });

    setInput("");
    setAttachments([]);
    setLocalStorageInput("");

    textareaRef.current?.focus();
  }, [
    input,
    locale,
    filter,
    chatId,
    selectedChatModel,
    reasoningEnabled,
    isTemporary,
    attachments,
  ]);

  return (
    <div
      className={cn(
        "relative w-full rounded-2xl border-t shadow-[0_-5px_10px_-10px] sm:border sm:shadow-xl",
        isTemporary
          ? "bg-foreground/85 text-background"
          : "bg-background text-foreground",
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="border-primary/50 bg-background/80 absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed">
          <span className="text-muted-foreground text-sm">Drop files here</span>
        </div>
      )}

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div className="flex flex-row items-end gap-2 overflow-x-scroll border-b p-1">
          {attachments.map((attachment, index) => (
            <AttachmentPreview
              key={index}
              attachment={attachment}
              onRemove={() => handleRemoveAttachment(index)}
            />
          ))}

          {uploadQueue.map((filename) => (
            <AttachmentPreview
              key={filename}
              attachment={{
                filename,
                contentType: "",
              }}
              isUploading={true}
            />
          ))}
        </div>
      )}

      {!isPractice && <ContextFiles />}

      <Textarea
        textareaRef={textareaRef}
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        submitForm={submitForm}
      />
      <TextAreaControl
        input={input}
        onFileChange={(event: ChangeEvent<HTMLInputElement>) => {
          handleFileChange(event, setAttachments);
        }}
        isLoading={isLoading}
        stop={stop}
        submitForm={submitForm}
        uploadQueue={uploadQueue}
        onVoiceInput={handleVoiceInput}
      />
    </div>
  );
};

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.status !== nextProps.status) return false;

    return true;
  },
);
