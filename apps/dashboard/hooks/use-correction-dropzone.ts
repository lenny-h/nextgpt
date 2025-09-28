import { useGlobalTranslations } from "@/contexts/global-translations";
import { type Upload } from "@/types/upload";
import { checkResponse } from "@workspace/ui/lib/translation-utils";
import { useBaseDropzone } from "./use-base-dropzone";

interface Props {
  onUploadChange?: (uploads: { [key: string]: Upload }) => void;
  maxFiles?: number;
}

export function useCorrectionDropzone({
  onUploadChange,
  maxFiles,
}: Props = {}) {
  const { globalT } = useGlobalTranslations();

  const getSignedUrl = async (file: File, name: string) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/capi/protected/correction/get-signed-url`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          filename: name,
          fileSize: file.size,
          fileType: file.type,
        }),
      },
    );

    checkResponse(response, globalT.globalErrors);
    return response.json();
  };

  return useBaseDropzone({
    onUploadChange,
    getSignedUrl,
    maxFiles,
    useGoogleStorage: true,
  });
}
