import React, { type ChangeEvent } from "react";
import { AttachmentsButton } from "./attachments-button";
import { SendButton } from "./send-button";
import { StopButton } from "./stop-button";
import { ModelSelector } from "./model-selector";
import { ReasoningButton } from "./reasoning-button";
import { MicrophoneButton } from "./microphone-button";

interface TextAreaControlProps {
  input: string;
  isLoading: boolean;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  stop: () => void;
  submitForm: () => void;
  uploadQueue: Array<string>;
  onVoiceInput: (text: string) => void;
}

export const TextAreaControl: React.FC<TextAreaControlProps> = ({
  input,
  isLoading,
  onFileChange,
  stop,
  submitForm,
  uploadQueue,
  onVoiceInput,
}) => {
  return (
    <div className="flex items-center justify-between gap-2 px-2 pb-2">
      <div className="flex min-w-0 flex-1 items-center space-x-2">
        <ModelSelector />
        <ReasoningButton />
      </div>

      <div className="flex items-center space-x-2">
        <MicrophoneButton isLoading={isLoading} onTranscript={onVoiceInput} />
        <AttachmentsButton isLoading={isLoading} onFileChange={onFileChange} />
        {isLoading ? (
          <StopButton stop={stop} />
        ) : (
          <SendButton
            input={input}
            submitForm={submitForm}
            uploadQueue={uploadQueue}
          />
        )}
      </div>
    </div>
  );
};
