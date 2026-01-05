import React, { type ChangeEvent } from "react";
import { AttachmentsButton } from "./attachments-button";
import { MicrophoneButton } from "./microphone-button";
import { ModelSelector } from "./model-selector";
import { ReasoningButton } from "./reasoning-button";
import { ScreenshotButton } from "./screenshot-button";
import { SendButton } from "./send-button";
import { StopButton } from "./stop-button";
import { WebSearchButton } from "./web-search-button";

interface TextAreaControlProps {
  input: string;
  uploadQueue: Array<string>;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onScreenshotCapture: (file: File) => void;
  onVoiceInput: (text: string) => void;
  submitForm: () => void;
  isLoading: boolean;
  stop: () => void;
}

export const TextAreaControl: React.FC<TextAreaControlProps> = ({
  input,
  uploadQueue,
  onFileChange,
  onScreenshotCapture,
  onVoiceInput,
  submitForm,
  isLoading,
  stop,
}) => {
  return (
    <div className="flex items-center justify-between gap-2 px-2 pb-2">
      <div className="flex min-w-0 flex-1 items-center space-x-2">
        <ModelSelector />
        <ReasoningButton />
        <WebSearchButton />
      </div>

      <div className="flex items-center space-x-2">
        <MicrophoneButton isLoading={isLoading} onTranscript={onVoiceInput} />
        <ScreenshotButton
          isLoading={isLoading}
          onScreenshotCapture={onScreenshotCapture}
        />
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
