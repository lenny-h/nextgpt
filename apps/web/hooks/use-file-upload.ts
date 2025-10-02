import { useGlobalTranslations } from "@/contexts/web-translations";
import { type Attachment } from "@/types/attachment";
import { checkResponse } from "@workspace/ui/lib/translation-utils";
import { useState, type ChangeEvent } from "react";
import { toast } from "sonner";

export const useFileUpload = () => {
  const { globalT } = useGlobalTranslations();

  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const getSignedUrl = async (file: File) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/capi/protected/attachments/get-signed-url`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          filename: file.name,
          fileSize: file.size,
          fileType: file.type,
        }),
      },
    );

    checkResponse(response, globalT.globalErrors);
    return response.json();
  };

  const uploadFile = async (file: File) => {
    try {
      const { signedUrl, newFilename } = await getSignedUrl(file);
      const renamedFile = new File([file], newFilename, { type: file.type });

      const uploadResponse = await fetch(signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
          "x-goog-content-length-range": `0,${file.size}`,
        },
        body: renamedFile,
      });

      checkResponse(uploadResponse, globalT.globalErrors);

      return {
        filename: newFilename,
        contentType: file.type,
      };
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : globalT.globalErrors.error,
      );
    }
  };

  const handleFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
    setAttachments: (fn: (current: Attachment[]) => Attachment[]) => void,
  ) => {
    const files = Array.from(event.target.files || []);
    setUploadQueue(files.map((file) => file.name));

    try {
      const uploadPromises = files.map((file) => uploadFile(file));
      const uploadedAttachments = await Promise.all(uploadPromises);
      const successfullyUploadedAttachments = uploadedAttachments.filter(
        (attachment): attachment is Attachment => attachment !== undefined,
      );

      setAttachments((currentAttachments) => [
        ...currentAttachments,
        ...successfullyUploadedAttachments,
      ]);
    } catch (error) {
      console.error("Error uploading files!", error);
    } finally {
      setUploadQueue([]);
    }
  };

  return {
    uploadQueue,
    handleFileChange,
  };
};
