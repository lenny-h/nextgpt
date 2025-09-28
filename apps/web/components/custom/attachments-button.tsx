import { useChatModel } from "@/contexts/selected-chat-model";
import { Button } from "@workspace/ui/components/button";
import { Paperclip } from "lucide-react";
import { memo, useRef, type ChangeEvent } from "react";

interface AttachmentButtonProps {
  isLoading: boolean;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

const PureAttachmentsButton = ({
  isLoading,
  onFileChange,
}: AttachmentButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { selectedChatModel } = useChatModel();

  const getAcceptedFileTypes = () => {
    const types = [];
    if (selectedChatModel.images) {
      types.push(".jpg", ".png");
    }
    if (selectedChatModel.pdfs) {
      types.push(".pdf");
    }
    return types.join(",");
  };

  return (
    <>
      <input
        accept={getAcceptedFileTypes()}
        aria-label="Attach files"
        className="sr-only"
        max={3}
        multiple
        onChange={onFileChange}
        ref={fileInputRef}
        tabIndex={-1}
        type="file"
      />
      <Button
        className="rounded-xl"
        disabled={isLoading}
        onClick={(event) => {
          event.preventDefault();
          fileInputRef.current?.click();
        }}
        variant="ghost"
      >
        <Paperclip size={14} />
      </Button>
    </>
  );
};

export const AttachmentsButton = memo(PureAttachmentsButton);
