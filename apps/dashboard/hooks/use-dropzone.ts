import { useGlobalTranslations } from "@/contexts/dashboard-translations";
import { checkResponse } from "@workspace/ui/lib/translation-utils";
import { useBaseDropzone } from "./use-base-dropzone";

interface Props {
  courseId: string;
  processingDate?: Date;
}

export function useDropzoneHook({ courseId, processingDate }: Props) {
  const { globalT } = useGlobalTranslations();

  const getSignedUrl = async (file: File, name: string) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/capi/protected/get-signed-url/${courseId}`,
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
          processingDate: processingDate?.toISOString(),
        }),
      },
    );

    checkResponse(response, globalT.globalErrors);
    return response.json();
  };

  return useBaseDropzone({ getSignedUrl });
}
