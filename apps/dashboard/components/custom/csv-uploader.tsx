import { useGlobalTranslations } from "@/contexts/dashboard-translations";
import { Input } from "@workspace/ui/components/input";
import { checkResponse } from "@workspace/ui/lib/translation-utils";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  bucketId: string;
}

export const CSVUploader = ({ bucketId }: Props) => {
  const { globalT } = useGlobalTranslations();

  const [file, setFile] = useState<File | null>(null);

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

    setFile(selectedFile);

    toast.promise(handleSubmit(), {
      loading: "Processing CSV file...",
      success: (result) => {
        setFile(null);
        return `${result.nameCount} names processed successfully`;
      },
      error: (err) => {
        return `Error processing file: ${err.message}`;
      },
    });
  };

  const handleSubmit = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucketId", bucketId);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/capi/protected/process-csv/${bucketId}`,
      {
        method: "POST",
        credentials: "include",
        body: formData,
      },
    );

    checkResponse(response, globalT.globalErrors);

    const result = await response.json();
    return result;
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
