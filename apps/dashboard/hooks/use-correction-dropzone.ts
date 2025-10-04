import { type Upload } from "@/types/upload";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { useBaseDropzone } from "./use-base-dropzone";

interface Props {
  onUploadChange?: (uploads: { [key: string]: Upload }) => void;
  maxFiles?: number;
}

export function useCorrectionDropzone({
  onUploadChange,
  maxFiles,
}: Props = {}) {
  const { sharedT } = useSharedTranslations();

  const getSignedUrl = async (file: File, name: string) => {
    const result = await apiFetcher(
      (client) =>
        client.correction["get-signed-url"].$post({
          json: {
            filename: name,
            fileSize: file.size,
            fileType: "application/pdf" as const,
          },
        }),
      sharedT.apiCodes,
    );
    // Map newFilename to extFilename for compatibility with useBaseDropzone
    return {
      signedUrl: result.signedUrl,
      extFilename: result.newFilename,
    };
  };

  return useBaseDropzone({
    onUploadChange,
    getSignedUrl,
    maxFiles,
    useGoogleStorage: true,
  });
}
