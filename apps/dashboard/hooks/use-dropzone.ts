import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { useBaseDropzone } from "./use-base-dropzone";

interface Props {
  courseId: string;
  processingDate?: Date;
}

export function useDropzoneHook({ courseId, processingDate }: Props) {
  const { sharedT } = useSharedTranslations();

  const getSignedUrl = async (file: File, name: string) => {
    return await apiFetcher(
      (client) =>
        client["get-signed-url"][":courseId"].$post({
          param: { courseId },
          json: {
            filename: name,
            fileSize: file.size,
            fileType: file.type as "application/pdf",
            processingDate: processingDate?.toISOString(),
          },
        }),
      sharedT.apiCodes,
    );
  };

  return useBaseDropzone({ getSignedUrl });
}
