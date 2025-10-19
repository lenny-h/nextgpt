import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { Mic, MicOff } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface MicrophoneButtonProps {
  isLoading: boolean;
  onTranscript: (text: string) => void;
}

const PureMicrophoneButton = ({
  isLoading,
  onTranscript,
}: MicrophoneButtonProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    if (
      !("SpeechRecognition" in window) &&
      !("webkitSpeechRecognition" in window)
    ) {
      setIsSupported(false);
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      // Use Web Speech API for speech-to-text
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        toast.error("Speech recognition is not supported in your browser");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      let finalTranscript = "";

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
        toast.error(`Speech recognition error: ${event.error}`);
      };

      recognition.onend = () => {
        setIsRecording(false);
        if (finalTranscript.trim()) {
          onTranscript(finalTranscript.trim());
        }
      };

      mediaRecorderRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording");
      setIsRecording(false);
    }
  }, [onTranscript]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  }, []);

  const handleClick = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  if (!isSupported) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className={`rounded-full p-2 ${
            isRecording
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-transparent"
          }`}
          onClick={handleClick}
          disabled={isLoading}
          type="button"
          variant="ghost"
          size="icon"
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        >
          {isRecording ? (
            <MicOff className="size-5" />
          ) : (
            <Mic className="size-5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isRecording ? "Stop recording" : "Voice input"}
      </TooltipContent>
    </Tooltip>
  );
};

export const MicrophoneButton = memo(PureMicrophoneButton);
