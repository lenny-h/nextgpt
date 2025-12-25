import { type Upload } from "@/types/upload";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { generateUUID } from "@workspace/ui/lib/utils";
import { renameSchema } from "@workspace/ui/lib/validations";
import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";

interface Props {
  getSignedUrl: (
    file: File,
    name: string,
  ) => Promise<{
    signedUrl: string;
    extFilename: string;
    processingDate?: string;
    headers?: Record<string, string>;
  }>;
  onUploadChange?: (uploads: { [key: string]: Upload }) => void;
  maxFiles?: number;
}

export function useBaseDropzone({
  getSignedUrl,
  onUploadChange,
  maxFiles,
}: Props) {
  const { sharedT } = useSharedTranslations();
  const [uploads, setUploads] = useState<{ [key: string]: Upload }>({});

  useEffect(() => {
    onUploadChange?.(uploads);
  }, [uploads, onUploadChange]);

  const handleFileUpload = async (file: File, name: string) => {
    try {
      if (!name.endsWith(".pdf")) {
        throw new Error("Filename must end with .pdf");
      }
      const nameWithoutExt = name.slice(0, -4);
      renameSchema.parse(nameWithoutExt);
    } catch (error) {
      setUploads((prev) => ({
        ...prev,
        [generateUUID()]: {
          id: generateUUID(),
          name,
          state: "failure",
          error:
            error instanceof Error
              ? error.message
              : "Filename must not contain special characters",
        },
      }));
      return;
    }

    const id = generateUUID();
    setUploads((prev) => ({
      ...prev,
      [id]: { id, name, state: "uploading", progress: 0 },
    }));

    try {
      const { signedUrl, extFilename, headers } = await getSignedUrl(
        file,
        name,
      );
      const renamedFile = new File([file], extFilename, { type: file.type });

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
          const percentCompleted = event.total
            ? Math.round((event.loaded * 100) / event.total)
            : 0;
          setUploads((pre) => ({
            ...pre,
            [id]: { ...pre[id]!, progress: percentCompleted },
          }));
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.response);
          } else {
            console.error(
              "Upload failed:",
              xhr.status,
              xhr.statusText,
              xhr.responseText,
            );
            reject(
              new Error(`HTTP Error: ${xhr.status} - ${xhr.responseText}`),
            );
          }
        };

        xhr.onerror = (e) => {
          console.error("XHR Error:", e);
          reject(new Error("Network Error"));
        };

        console.log("Uploading:", {
          fileSize: file.size,
          fileType: file.type,
          fileName: file.name,
        });

        xhr.open("PUT", signedUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        if (headers) {
          Object.entries(headers).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value);
          });
        }

        xhr.send(renamedFile);
      });

      setUploads((pre) => ({
        ...pre,
        [id]: { ...pre[id]!, state: "success" },
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : sharedT.apiCodes.FALLBACK_ERROR;
      setUploads((pre) => ({
        ...pre,
        [id]: { ...pre[id]!, state: "failure", error: message },
      }));
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => handleFileUpload(file, file.name));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: 15 * 1024 * 1024,
    maxFiles: maxFiles ?? 5,
  });

  return {
    getRootProps,
    getInputProps,
    isDragActive,
    uploads,
  };
}
