import { Input } from "@workspace/ui/components/input";
import { useSharedTranslations } from "@workspace/ui/contexts/shared-translations-context";
import { apiFetcher } from "@workspace/ui/lib/fetcher";
import { toast } from "sonner";

interface Props {
  bucketId: string;
}

export const CSVUploader = ({ bucketId }: Props) => {
  const { sharedT } = useSharedTranslations();

  const handleSubmit = async (file: File) => {
    const result = await apiFetcher(
      (client) =>
        client["process-csv"][":bucketId"].$post({
          param: { bucketId },
          form: {
            file,
          },
        }),
      sharedT.apiCodes,
    );

    return result;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selectedFile = e.target.files[0];

    if (!selectedFile) return;

    if (selectedFile.type !== "text/csv") {
      toast.error("Please select a valid CSV file");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10 MB");
      return;
    }

    toast.promise(handleSubmit(selectedFile), {
      loading: "Processing CSV file...",
      success: (result) => `${result.nameCount} names processed successfully`,
      error: (err) => {
        return `Error processing file: ${err.message}`;
      },
    });
  };

  return (
    <Input
      id="users"
      type="file"
      accept=".csv, text/csv"
      className="w-80 cursor-pointer"
      onChange={handleFileChange}
    />
  );
};
