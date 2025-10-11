import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { useBaseDropzone } from "./use-base-dropzone";

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

export function useDropzoneHook({
  courseId,
  processingDate,
  pdfPipelineOptions,
}: Props) {
  const { sharedT } = useSharedTranslations();

  const getSignedUrl = async (file: File, name: string) => {
    // Only include pdfPipelineOptions if at least one option is enabled
    const hasAnyOptionEnabled = pdfPipelineOptions
      ? Object.values(pdfPipelineOptions).some((value) => value === true)
      : false;

    return await apiFetcher(
      (client) =>
        client["get-signed-url"][":courseId"].$post({
          param: { courseId },
          json: {
            filename: name,
            fileSize: file.size,
            fileType: file.type,
            processingDate: processingDate?.toISOString(),
            ...(hasAnyOptionEnabled && { pdfPipelineOptions }),
          },
        }),
      sharedT.apiCodes,
    );
  };

  return useBaseDropzone({ getSignedUrl });
}
